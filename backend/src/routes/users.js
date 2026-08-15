import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadImage } from '../services/cloudinaryService.js';

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const publicProfile = user.toPublicJSON();
    delete publicProfile.email;
    delete publicProfile.phone;

    res.json({ user: publicProfile });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', protect, upload.single('profilePicture'), async (req, res, next) => {
  try {
    const { name, studentId, department, batch, phone } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (studentId !== undefined) user.studentId = studentId;
    if (department !== undefined) user.department = department;
    if (batch !== undefined) user.batch = batch;
    if (phone !== undefined) user.phone = phone;

    if (req.file) {
      const { url } = await uploadImage(req.file.buffer, 'profiles');
      user.profilePicture = url;
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

router.post('/fcm-token', protect, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'FCM token required' });

    const user = await User.findById(req.user._id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ message: 'FCM token registered' });
  } catch (err) {
    next(err);
  }
});

router.get('/leaderboard/finders', async (req, res, next) => {
  try {
    const finders = await User.find({ itemsReturned: { $gt: 0 }, isActive: true })
      .sort({ reputation: -1, itemsReturned: -1 })
      .limit(10)
      .select('name profilePicture reputation badges itemsReturned itemsFound department');

    res.json({ finders });
  } catch (err) {
    next(err);
  }
});

export default router;
