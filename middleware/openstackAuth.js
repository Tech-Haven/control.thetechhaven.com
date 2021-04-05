const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const validateToken = require('../controllers/openstack/helpers/validateToken');

// Protected routes. Ensure token is valid in headers.
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return next(new ErrorResponse('Invalid token', 401));
  }

  // Check if token is valid
  try {
    const tokenRes = await validateToken(token);
    req.validToken = tokenRes.data;
    next();
  } catch (error) {
    return next(new ErrorResponse('Invalid token', 401));
  }
});

// Admin only routes. Ensure token's owner has the 'admin' role
exports.adminOnly = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  // Check if user has the admin role
  try {
    const data = await validateToken(token);
    const isAdmin = data.data.token.roles.find((r) => r.name === 'admin');
    if (!isAdmin) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }
    next();
  } catch (error) {
    console.error(error);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});
