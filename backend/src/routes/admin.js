import express from 'express';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      returnedItems,
      pendingClaims,
      pendingReports,
      recentItems,
      categoryStats,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Item.countDocuments({ isApproved: true }),
      Item.countDocuments({ type: 'lost', isApproved: true }),
      Item.countDocuments({ type: 'found', isApproved: true }),
      Item.countDocuments({ status: 'returned' }),
      Claim.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      Item.find({ isApproved: true }).sort('-createdAt').limit(5).populate('postedBy', 'name'),
      Item.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const monthlyStats = await Item.aggregate([
      { $match: { isApproved: true, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalItems,
        lostItems,
        foundItems,
        returnedItems,
        pendingClaims,
        pendingReports,
        returnRate: totalItems ? Math.round((returnedItems / totalItems) * 100) : 0,
      },
      categoryStats,
      monthlyStats,
      recentItems,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(filter);

    res.json({ users: users.map((u) => u.toPublicJSON()), total });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/toggle', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.get('/items', async (req, res, next) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const items = await Item.find(filter)
      .populate('postedBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
});

router.put('/items/:id/approve', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.isApproved = true;
    await item.save();

    await createNotification(item.postedBy, {
      type: 'post_approved',
      title: 'Post Approved',
      message: `Your post "${item.name}" has been approved`,
      link: `/items/${item._id}`,
      relatedItem: item._id,
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

router.put('/items/:id/remove', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.isApproved = false;
    item.status = 'closed';
    await item.save();

    await createNotification(item.postedBy, {
      type: 'post_removed',
      title: 'Post Removed',
      message: `Your post "${item.name}" has been removed by an admin`,
      link: '/',
    });

    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
});

router.get('/claims', async (req, res, next) => {
  try {
    const claims = await Claim.find({ status: 'pending' })
      .populate('item', 'name photos type category')
      .populate('claimant', 'name email profilePicture reputation')
      .sort('-createdAt');

    res.json({ claims });
  } catch (err) {
    next(err);
  }
});
router.put('/claims/:id/review', async (req, res, next) => {
  try {
    const { status, rewardPaid } = req.body;

    const claim = await Claim.findById(req.params.id)
      .populate('item')
      .populate('claimant');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    claim.status = status;
    claim.rewardPaid = rewardPaid || false;
    claim.reviewedBy = req.user._id;
    await claim.save();

    if (status === 'approved' && claim.item) {
      claim.item.status = 'returned';
      await claim.item.save();
    }

    await createNotification(claim.claimant._id, {
      type: 'claim_review',
      title: `Claim ${status}`,
      message: `Your claim for "${claim.item?.name}" has been ${status}.`,
      link: `/claims`,
    });

    res.json({
      message: `Claim ${status} successfully`,
      claim,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('item', 'name photos type')
      .populate('reportedBy', 'name email')
      .sort('-createdAt');

    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

router.put('/reports/:id', async (req, res, next) => {
  try {
    const { status, adminNotes, removeItem } = req.body;
    const report = await Report.findById(req.params.id).populate('item');

    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status;
    report.adminNotes = adminNotes || '';
    report.reviewedBy = req.user._id;
    await report.save();

    if (removeItem && report.item) {
      report.item.isApproved = false;
      report.item.status = 'closed';
      await report.item.save();
    }

    res.json({ report });
  } catch (err) {
    next(err);
  }
});

export default router;
