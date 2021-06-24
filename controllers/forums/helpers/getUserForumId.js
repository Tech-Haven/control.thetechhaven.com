const asyncHandler = require('../../../middleware/async');

const User = require('../../../models/User');

const getUserForumId = asyncHandler(async (discordId) => {
  const u = await User.findById(discordId);
  return u;
});

module.exports = getUserForumId;
