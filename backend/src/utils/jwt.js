import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
