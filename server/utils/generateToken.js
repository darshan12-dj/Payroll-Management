const jwt = require('jsonwebtoken');

const generateAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

const generateResetToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: 'password_reset' },
    process.env.JWT_RESET_SECRET,
    { expiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m' }
  );
};

module.exports = { generateAuthToken, generateResetToken };
