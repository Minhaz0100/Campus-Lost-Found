import express from 'express';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { claimValidation, validate } from '../middleware/validate.js';
import { uploadMultiple } from '../services/cloudinaryService.js';
import { evaluateQuiz, updateUserBadges } from '../services/aiService.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

router.post('/:itemId', protect, upload.array('proofPhotos', 3), claimValidation, validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot claim your own item' });
    }

    if (!['lost', 'found'].includes(item.status)) {
      return res.status(400).json({ message: 'Item is not available for claiming' });
    }

    const existing = await Claim.findOne({
      item: item._id,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have a pending claim for this item' });
    }

    let proofPhotos = [];
    if (req.files?.length) {
      const uploads = await uploadMultiple(req.files, 'claims');
      proofPhotos = uploads.map((u) => u.url);
    }

    let quizAnswers = [];
    if (req.body.quizAnswers) {
      quizAnswers = typeof req.body.quizAnswers === 'string'
        ? JSON.parse(req.body.quizAnswers)
        : req.body.quizAnswers;
    }

    const { score, passed } = evaluateQuiz(item.verificationQuestions, quizAnswers);

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      proofDescription: req.body.proofDescription,
      proofPhotos,
      quizAnswers,
      quizScore: score,
      quizPassed: passed,
    });

    item.claimCount += 1;
    if (passed) item.status = 'claimed';
    await item.save();

    await createNotification(item.postedBy, {
      type: 'new_match',
      title: 'New Claim Request',
      message: `Someone has claimed your item "${item.name}"`,
      link: `/items/${item._id}`,
      relatedItem: item._id,
    });

    res.status(201).json({ claim, quizPassed: passed });
  } catch (err) {
    next(err);
  }
});

router.get('/item/:itemId', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const isOwner = item.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    const filter = { item: req.params.itemId };
    if (!isOwner && !isAdmin) {
      filter.claimant = req.user._id;
    }

    const claims = await Claim.find(filter)
      .populate('claimant', 'name profilePicture reputation badges department')
      .sort('-createdAt');

    res.json({ claims });
  } catch (err) {
    next(err);
  }
});

router.get('/my', protect, async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate('item', 'name photos status type category')
      .sort('-createdAt');

    res.json({ claims });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/review', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const claim = await Claim.findById(req.params.id)
      .populate('item')
      .populate('claimant');

    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = status;
    claim.adminNotes = adminNotes || '';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    await claim.save();

    const item = claim.item;

    if (status === 'approved') {
      item.status = 'returned';
      item.rewardPaid = req.body.rewardPaid || false;
      await item.save();

      const finder = await User.findById(item.postedBy);
      if (finder) {
        finder.itemsReturned += 1;
        finder.reputation += 10;
        finder.badges = updateUserBadges(finder);
        await finder.save();
      }

      const claimant = await User.findById(claim.claimant._id);
      if (claimant) {
        claimant.reputation += 5;
        claimant.badges = updateUserBadges(claimant);
        await claimant.save();
      }

      await createNotification(claim.claimant._id, {
        type: 'claim_accepted',
        title: 'Claim Approved!',
        message: `Your claim for "${item.name}" has been approved`,
        link: `/items/${item._id}`,
        relatedItem: item._id,
      });
    } else if (status === 'rejected') {
      item.status = item.type === 'lost' ? 'lost' : 'found';
      await item.save();

      await createNotification(claim.claimant._id, {
        type: 'claim_rejected',
        title: 'Claim Rejected',
        message: `Your claim for "${item.name}" was not approved`,
        link: `/items/${item._id}`,
        relatedItem: item._id,
      });
    }

    res.json({ claim });
  } catch (err) {
    next(err);
  }
});

export default router;
