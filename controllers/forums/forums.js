const axios = require('axios');

const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const getUserForumId = require('./helpers/getUserForumId');
const findForumUserId = require('./helpers/findForumUserId');

exports.createThread = asyncHandler(async (req, res, next) => {
  const { node_id, title, message } = req.body;
  const apiKey = req.headers['xf-api-key'];
  const discordId = req.headers['discord-id'];

  if (!node_id || !title || !message) {
    return next(
      new ErrorResponse('Please provide a node_id, title, and messsage', 400)
    );
  }

  const validNodeIDs = [37, 9, 10, 11, 12, 13, 14, 15];

  if (!validNodeIDs.includes(node_id)) {
    return next(new ErrorResponse('Invalid node_id', 400));
  }

  if (!apiKey) {
    return next(new ErrorResponse('XF-Api-Key header required', 401));
  }

  if (!discordId) {
    return next(new ErrorResponse('Discord-ID header required', 400));
  }

  // Make sure user exists
  const user = await getUserForumId(discordId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (!user.forumUserId) {
    return next(new ErrorResponse('Forum User ID not found', 404));
  }

  const params = new URLSearchParams();
  params.append(`node_id`, node_id);
  params.append(`title`, title);
  params.append(`message`, message);

  const threadRes = await axios({
    method: 'post',
    url: `https://thetechhaven.com/api/threads`,
    params,
    headers: {
      'XF-Api-Key': apiKey,
      'XF-Api-User': user.forumUserId,
    },
  });

  res.status(200).json({ success: true, data: threadRes.data });
});

exports.saveForumUserId = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['xf-api-key'];
  const { discord_user } = req.body;
  const { id, username, discriminator } = discord_user;

  if (!apiKey || apiKey !== process.env.FORUMS_TOKEN) {
    return next(new ErrorResponse('Unauthorized', 401));
  }

  if (!discord_user || !id || !username || !discriminator) {
    return next(
      new ErrorResponse(
        'discord_user: { id, username, discriminator } required',
        400
      )
    );
  }

  const user = await findForumUserId(apiKey, username);

  const query = {
    _id: id,
    username,
    discriminator,
    forumUserId: user.user_id,
  };

  let u = await User.findOneAndUpdate({ _id: id }, query, {
    upsert: true,
    new: true,
  });

  res
    .status(200)
    .json({ success: true, data: 'Forum User ID saved to database' });
});
