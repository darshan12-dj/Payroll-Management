const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the JWT in the Authorization header and attaches the
 * authenticated user (minus password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized. Token is invalid or expired.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized. User no longer exists.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
  }

  req.user = user;
  next();
});

/**
 * Role-based access control. Usage: authorize('admin', 'payroll_manager')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized.');
  }
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, `Access denied. Requires one of: ${allowedRoles.join(', ')}.`);
  }
  next();
};

/**
 * Restricts an `employee` role user to only ever accessing records that
 * belong to their own linked Employee document — whether that id shows up
 * as a route param or a query string filter. Admins/payroll managers pass
 * through untouched. This is what keeps an employee from viewing a
 * colleague's salary/bank details just by changing an ID in the URL.
 */
const restrictEmployeeSelf = (...idSources) => (req, res, next) => {
  if (req.user.role !== 'employee') return next();

  const ownEmployeeId = req.user.employee ? String(req.user.employee) : null;
  if (!ownEmployeeId) {
    throw new ApiError(403, 'Your account is not linked to an employee record.');
  }

  const requestedId =
    idSources
      .map((source) => {
        const [bucket, key] = source.split('.');
        return req[bucket]?.[key];
      })
      .find((val) => val !== undefined) || null;

  // If no id was supplied at all (e.g. a list endpoint with no filter),
  // force it to the caller's own employee id so they can't see everyone.
  if (!requestedId) {
    if (idSources[0]?.startsWith('query.')) {
      req.query[idSources[0].split('.')[1]] = ownEmployeeId;
    }
    return next();
  }

  if (String(requestedId) !== ownEmployeeId) {
    throw new ApiError(403, 'You can only access your own records.');
  }
  next();
};

module.exports = { protect, authorize, restrictEmployeeSelf };
