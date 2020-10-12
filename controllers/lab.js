const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { labLogin } = require('../utils/lab');

// @desc    Authenticate to THLAB
// @route   POST /api/v1/lab/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const userObject = await labLogin(req.body.username, req.body.password);

  if (!userObject || userObject.error) {
    next(new ErrorResponse(`Invalid login. Please try again.`, 401));
  }

  const { userId, username, login_token } = userObject;

  req.session.lab_username = username;
  req.session.lab_token = login_token;

  res.status(200).json({
    success: true,
    data: {
      userId,
      username,
    },
  });
});
