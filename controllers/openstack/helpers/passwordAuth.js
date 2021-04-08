const axios = require('axios');

const identityUrl = process.env.OPENSTACK_IDENTITY_URL;

const passwordAuth = async (username, password) => {
  const config = {
    method: 'post',
    url: `${identityUrl}/auth/tokens`,
    data: {
      auth: {
        identity: {
          methods: ['password'],
          password: {
            user: {
              domain: {
                name: 'Default',
              },
              name: username,
              password,
            },
          },
        },
      },
    },
  };

  const response = await axios(config);
  return response;
};

module.exports = passwordAuth;
