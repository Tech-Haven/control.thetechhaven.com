const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const validateToken = require('../controllers/openstack/helpers/validateToken');

// Protected routes. Ensure token is valid in headers.
exports.protect = asyncHandler(async (req, res, next) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    return next(new ErrorResponse('X-Auth-Token required', 400));
  }

  // Check if token is valid
  const tokenRes = await validateToken(token);
  req.xAuthToken = tokenRes.data.token;
  next();
});

// Admin only routes. Ensure token's owner has the 'admin' role
exports.adminOnly = asyncHandler(async (req, res, next) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    return next(new ErrorResponse('X-Auth-Token required', 401));
  }

  const tokenRes = await validateToken(token);
  const isAdmin = tokenRes.data.token.roles.find((r) => r.name === 'admin');
  if (!isAdmin) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
  next();
});
