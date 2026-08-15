import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { itemValidation, validate } from '../middleware/validate.js';
import { uploadMultiple } from '../services/cloudinaryService.js';
import { generateItemQR } from '../services/qrService.js';
import {
  extractKeywords,
  computeImageHash,
  computeImageFeatures,
  computeMatchScore,
  findMatches,
  detectDuplicate,
  isEmergencyItem,
  performOCR,
  generateVerificationQuestions,
} from '../services/aiService.js';
import { createNotification, notifyMultiple } from '../services/notificationService.js';

const router = express.Router();

const parseLocation = (location) => {
  if (typeof location === 'string') return JSON.parse(location);
  return location;
};

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      type,
      category,
      status,
      keyword,
      lat,
      lng,
      radius,
      serialNumber,
      barcode,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const filter = { isApproved: true };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (serialNumber) filter.serialNumber = new RegExp(serialNumber, 'i');
    if (barcode) filter.barcode = new RegExp(barcode, 'i');

    if (keyword) {
      filter.$text = { $search: keyword };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let items = await Item.find(filter)
      .populate('postedBy', 'name profilePicture reputation badges department')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      items = items.filter((item) => {
        if (!item.location.lat || !item.location.lng) return true;
        const dist = haversine(latNum, lngNum, item.location.lat, item.location.lng);
        return dist <= radiusKm;
      });
    }

    const total = await Item.countDocuments(filter);

    const sanitized = items.map((item) => sanitizeItem(item, req.user));

    res.json({
      items: sanitized,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/recent', async (req, res, next) => {
  try {
    const items = await Item.find({ isApproved: true })
      .sort('-createdAt')
      .limit(8)
      .populate('postedBy', 'name profilePicture');

    res.json({ items: items.map((i) => sanitizeItem(i)) });
  } catch (err) {
    next(err);
  }
});

router.get('/heatmap', async (req, res, next) => {
  try {
    const items = await Item.find({
      isApproved: true,
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
    }).select('location type category status createdAt');

    const heatmap = items.map((item) => ({
      lat: item.location.lat,
      lng: item.location.lng,
      weight: item.type === 'lost' ? 2 : 1,
      category: item.category,
      type: item.type,
    }));

    res.json({ heatmap });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name profilePicture reputation badges department studentId batch phone email')
      .populate('matchedItems', 'name category photos status type matchScore');

    if (!item || !item.isApproved) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.views += 1;
    await item.save();

    res.json({ item: sanitizeItem(item, req.user, true) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/matches', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const matches = await findMatches(item, Item);

    res.json({
      matches: matches.map((m) => ({
        item: sanitizeItem(m.item),
        score: m.score,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, upload.array('photos', 5), itemValidation, validate, async (req, res, next) => {
  try {
    const data = req.body;
    const location = parseLocation(data.location);

    let photos = [];
    let imageHash = '';
    let imageFeatures = [];
    let ocrText = '';

    if (req.files?.length) {
      const uploads = await uploadMultiple(req.files);
      photos = uploads.map((u) => u.url);

      imageHash = await computeImageHash(req.files[0].buffer);
      imageFeatures = await computeImageFeatures(req.files[0].buffer);
      ocrText = await performOCR(req.files[0].buffer);
    }

    const keywords = [
      ...extractKeywords(data.name),
      ...extractKeywords(data.description),
      ...extractKeywords(ocrText),
    ];

    const isEmergency = isEmergencyItem(data.category, data.name);

    const item = await Item.create({
      type: data.type,
      name: data.name,
      category: data.category,
      description: data.description,
      location,
      dateTime: new Date(data.dateTime),
      photos,
      imageHash,
      imageFeatures,
      reward: data.reward ? parseFloat(data.reward) : 0,
      postedBy: req.user._id,
      isAnonymous: data.isAnonymous === 'true' || data.isAnonymous === true,
      serialNumber: data.serialNumber || '',
      barcode: data.barcode || '',
      ocrText,
      keywords: [...new Set(keywords)],
      isEmergency,
      verificationQuestions: [],
    });

    const qr = await generateItemQR(item._id, process.env.CLIENT_URL);
    item.qrCode = qr.qrCode;
    item.qrCodeDataUrl = qr.qrCodeDataUrl;

    item.verificationQuestions = generateVerificationQuestions(item);

    const duplicate = await detectDuplicate(item, Item);
    if (duplicate) {
      item.duplicateWarning = true;
      item.duplicateOf = duplicate._id;
    }

    const matches = await findMatches(item, Item);
    item.matchedItems = matches.map((m) => m.item._id);
    item.matchScore = matches[0]?.score || 0;

    await item.save();

    if (matches.length) {
      await createNotification(req.user._id, {
        type: 'new_match',
        title: 'Potential Match Found!',
        message: `We found ${matches.length} potential match(es) for "${item.name}"`,
        link: `/items/${item._id}`,
        relatedItem: item._id,
      });

      for (const match of matches.slice(0, 3)) {
        if (match.score >= 50) {
          await createNotification(match.item.postedBy, {
            type: 'new_match',
            title: 'New Matching Item!',
            message: `A ${item.type} item "${item.name}" may match your post`,
            link: `/items/${match.item._id}`,
            relatedItem: item._id,
          });
        }
      }
    }

    if (isEmergency) {
      const admins = await User.find({ role: 'admin', isActive: true });
      await notifyMultiple(
        admins.map((a) => a._id),
        {
          type: 'emergency_alert',
          title: 'Emergency Lost Item Alert!',
          message: `Critical item reported: ${item.name} (${item.category})`,
          link: `/items/${item._id}`,
          relatedItem: item._id,
        }
      );
    }

    await item.populate('postedBy', 'name profilePicture');

    res.status(201).json({
      item: sanitizeItem(item, req.user, true),
      matches: matches.map((m) => ({ id: m.item._id, name: m.item.name, score: m.score })),
      duplicateWarning: item.duplicateWarning,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ message: 'Item not found' });

    const isOwner = item.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.status = status;
    await item.save();

    await createNotification(item.postedBy, {
      type: 'status_update',
      title: 'Item Status Updated',
      message: `Your item "${item.name}" is now marked as ${status}`,
      link: `/items/${item._id}`,
      relatedItem: item._id,
    });

    res.json({ item: sanitizeItem(item, req.user, true) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report', protect, async (req, res, next) => {
  try {
    const Report = (await import('../models/Report.js')).default;
    const { reason, description } = req.body;

    const report = await Report.create({
      item: req.params.id,
      reportedBy: req.user._id,
      reason,
      description,
    });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const isOwner = item.postedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.isApproved = false;
    item.status = 'closed';
    await item.save();

    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
});

router.post('/ai/similar', protect, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Photo required' });

    const imageHash = await computeImageHash(req.file.buffer);
    const imageFeatures = await computeImageFeatures(req.file.buffer);

    const candidates = await Item.find({
      isApproved: true,
      status: { $in: ['lost', 'found'] },
      imageHash: { $exists: true, $ne: '' },
    }).limit(100);

    const source = { imageHash, imageFeatures, keywords: [], name: '', category: req.body.category || '' };

    const similar = candidates
      .map((item) => ({
        item: sanitizeItem(item),
        score: computeMatchScore(source, item),
      }))
      .filter((s) => s.score >= 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ similar });
  } catch (err) {
    next(err);
  }
});

function sanitizeItem(item, user, showContact = false) {
  const obj = item.toObject ? item.toObject() : item;

  if (obj.isAnonymous && (!user || obj.postedBy?._id?.toString() !== user._id.toString())) {
    obj.postedBy = { name: 'Anonymous', profilePicture: '' };
  } else if (!showContact && obj.postedBy) {
    const postedBy = { ...obj.postedBy };
    delete postedBy.email;
    delete postedBy.phone;
    delete postedBy.studentId;
    obj.postedBy = postedBy;
  }

  return obj;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
