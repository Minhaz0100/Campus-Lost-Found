import express from 'express';
import Message from '../models/Message.js';
import Item from '../models/Item.js';
import { protect } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

router.get('/:itemId', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const isInvolved =
      item.postedBy.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    const claims = await (await import('../models/Claim.js')).default.find({
      item: item._id,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (!isInvolved && !claims.length) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    const messages = await Message.find({ item: req.params.itemId })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .sort('createdAt');

    await Message.updateMany(
      { item: req.params.itemId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post('/:itemId', protect, async (req, res, next) => {
  try {
    const { content, receiverId } = req.body;
    const item = await Item.findById(req.params.itemId);

    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!content?.trim()) return res.status(400).json({ message: 'Message content required' });

    const message = await Message.create({
      item: req.params.itemId,
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
    });

    await message.populate('sender', 'name profilePicture');
    await message.populate('receiver', 'name profilePicture');

    await createNotification(receiverId, {
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name} sent you a message about "${item.name}"`,
      link: `/items/${item._id}`,
      relatedItem: item._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${req.params.itemId}`).emit('new-message', message);
    }

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

export default router;
