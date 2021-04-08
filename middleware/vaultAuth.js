const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const validateVaultToken = require('../controllers/vault/helpers/validateVaultToken');

// Protected routes. Ensure token is valid in headers.
exports.vaultProtect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers['x-vault-token']) {
    token = req.headers['x-vault-token'];
  }

  if (!token) {
    return next(new ErrorResponse('Invalid vault token null', 401));
  }

  // Check if token is valid
  try {
    await validateVaultToken(token);
    next();
  } catch (error) {
    console.log(error.response);
    return next(new ErrorResponse('Invalid vault token', 401));
  }
});
