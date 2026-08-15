import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('studentId').optional().trim(),
  body('department').optional().trim(),
  body('batch').optional().trim(),
  body('phone').optional().trim(),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const itemValidation = [
  body('type').isIn(['lost', 'found']).withMessage('Type must be lost or found'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('dateTime').notEmpty().withMessage('Date and time are required'),
];

export const claimValidation = [
  body('proofDescription').trim().notEmpty().withMessage('Proof description is required'),
];
