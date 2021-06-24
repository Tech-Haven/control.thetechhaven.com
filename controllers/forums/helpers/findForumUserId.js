const axios = require('axios');
const asyncHandler = require('../../../middleware/async');

const findForumUserId = asyncHandler(async (apiKey, username) => {
  const params = new URLSearchParams();
  params.append(`username`, username);

  const res = await axios({
    method: 'get',
    url: `https://thetechhaven.com/api/users/find-name`,
    params,
    headers: {
      'XF-Api-Key': apiKey,
    },
  });
  return res.data.exact;
});

module.exports = findForumUserId;
