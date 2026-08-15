import express from 'express';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { generateToken as genToken, hashToken } from '../utils/tokens.js';
import { protect } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../middleware/validate.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/register', registerValidation, validate, async (req, res, next) => {
  try {
    const { name, email, password, studentId, department, batch, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const verificationToken = genToken();
    const user = await User.create({
      name,
      email,
      password,
      studentId,
      department,
      batch,
      phone,
      verificationToken: hashToken(verificationToken),
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginValidation, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token required' });

    const user = await User.findOne({
      verificationToken: hashToken(token),
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = genToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user, resetToken);

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
