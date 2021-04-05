const axios = require('axios');
const asyncHandler = require('../../../middleware/async');

const identityUrl = process.env.OPENSTACK_IDENTITY_URL;

const applicationCredentialAuth = asyncHandler(async (id, secret) => {
  const config = {
    method: 'post',
    url: `${identityUrl}/auth/tokens`,
    data: {
      auth: {
        identity: {
          methods: ['application_credential'],
          application_credential: {
            id,
            secret,
          },
        },
      },
    },
  };

  const response = await axios(config);
  return response;
});

module.exports = applicationCredentialAuth;
