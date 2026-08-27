const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an array of express-validator chains; throws a single
// formatted ApiError if any of them failed.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => e.msg);
    throw new ApiError(400, 'Validation failed', errors);
  }
  next();
};

module.exports = validate;
