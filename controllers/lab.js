const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const {
  labLogin,
  updateSSHKey,
  createVm,
  getTemplateInfo,
  getUserInfo,
  getAllVmInfo,
  getVmInfo,
} = require('../utils/lab');

// @desc    Authenticate to THLAB
// @route   POST /api/v1/lab/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new ErrorResponse(`Please provide an email and password`, 400));
  }

  const userObject = await labLogin(username, password);

  if (!userObject || userObject.error) {
    return next(new ErrorResponse(`Invalid login. Please try again.`, 401));
  }

  const { userId, login_token } = userObject;

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

// @desc    Update User's SSH key on THLAB
// @route   PUT /api/v1/lab/user/ssh
// @access  Private
exports.updateSSHKey = asyncHandler(async (req, res, next) => {
  const { sshKey } = req.body;

  if (!sshKey) {
    return next(new ErrorResponse(`Please provide a ssh key.`, 400));
  }

  const { lab_username, lab_token } = req.session;

  const sshUpdated = await updateSSHKey(lab_username, lab_token, sshKey);

  if (sshUpdated.error) {
    return res.status(400).send(sshUpdated.error);
  }

  res.status(200).send('SSH Key Updated!');
});

// @desc    Get user's infomation
// @route   GET /api/v1/lab/user/info
// @access  Public
exports.getUserInfo = asyncHandler(async (req, res, next) => {
  const { lab_username, lab_token } = req.session;

  const userObject = await getUserInfo(lab_username, lab_token);

  if (userObject.error) {
    return next(new ErrorResponse(userObject.error.msg, 401));
  }

  res.status(200).send(userObject);
});

// @desc    Get VM templates
// @route   GET /api/v1/lab/templatepool/info
// @access  Private
exports.getTemplatePoolInfo = asyncHandler(async (req, res, next) => {
  const { lab_username, lab_token } = req.session;

  const templateObject = await getTemplateInfo(lab_username, lab_token);

  if (templateObject.error) {
    return next(new ErrorResponse(templateObject.error.msg, 401));
  }

  res.status(200).send(templateObject);
});

// @desc    Create a VM
// @route   POST /api/v1/lab/vm/create
// @access  Private
exports.createVm = asyncHandler(async (req, res, next) => {
  const { templateId, vmName } = req.body;

  if (!templateId || !vmName) {
    return next(
      new ErrorResponse(`Please provide a template ID and VM name`, 400)
    );
  }

  const { lab_username, lab_token } = req.session;

  const createdVmId = await createVm(
    lab_username,
    lab_token,
    templateId,
    vmName
  );

  if (createdVmId.error) {
    return next(new ErrorResponse(createdVmId.error.msg, 400));
  }

  const vmObject = await getVmInfo(lab_username, lab_token, createdVmId);

  if (vmObject.error) {
    return next(new ErrorResponse(vmObject.error.msg, 400));
  }

  return res.status(200).send(vmObject);
});

// @desc    Returns all VM info for user
// @route   GET /api/v1/lab/vm/info
// @access  Private
exports.getAllVmInfo = asyncHandler(async (req, res, next) => {
  const { lab_username, lab_token } = req.session;

  const vmObject = await getAllVmInfo(lab_username, lab_token);

  if (vmObject.error) {
    return next(new ErrorResponse(vmObject.error.msg, 400));
  }

  res.status(200).send(vmObject);
});

// @desc    Returns single VM info based on vmid
// @route   GET /api/v1/lab/vm/info/:vmid
// @access  Private
exports.getVmInfo = asyncHandler(async (req, res, next) => {
  const { vmid } = req.params;

  if (!vmid || isNaN(vmid)) {
    return next(new ErrorResponse(`Please provide a valid vmid`, 400));
  }

  const { lab_username, lab_token } = req.session;

  const vmObject = await getVmInfo(lab_username, lab_token, vmid);

  if (vmObject.error) {
    return next(new ErrorResponse(vmObject.error.msg, 400));
  }

  res.status(200).send(vmObject);
});
