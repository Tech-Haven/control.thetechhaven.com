const axios = require('axios');
const asyncHandler = require('../../../middleware/async');
const getAdminToken = require('./getAdminToken');

const identityUrl = process.env.OPENSTACK_IDENTITY_URL;

const validateToken = asyncHandler(async (token) => {
  const adminToken = await getAdminToken();
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
