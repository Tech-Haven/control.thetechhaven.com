const axios = require('axios');
const asyncHandler = require('../../../middleware/async');

const identityUrl = process.env.OPENSTACK_IDENTITY_URL;
const adminToken = process.env.OPENSTACK_ADMIN_TOKEN; // TODO: Fetch admin token from vault instead of hardcode

const validateToken = asyncHandler(async (token) => {
  const config = {
    method: 'get',
    url: `${identityUrl}/auth/tokens`,
    headers: {
      'X-Auth-Token': adminToken,
      'X-Subject-Token': token,
    },
  };

  const response = await axios(config);
  return response;
});

module.exports = validateToken;
