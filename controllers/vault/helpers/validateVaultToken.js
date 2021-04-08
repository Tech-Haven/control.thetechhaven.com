const axios = require('axios');
const asyncHandler = require('../../../middleware/async');
const https = require('https');

const VAULT_URL = process.env.VAULT_URL;

const validateVaultToken = asyncHandler(async (token) => {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const config = {
    method: 'post',
    url: `${VAULT_URL}/v1/auth/token/lookup`,
    headers: {
      'X-Vault-Token': token,
    },
    httpsAgent: agent,
    data: {
      token,
    },
  };

  const response = await axios(config);
  return response;
});

module.exports = validateVaultToken;
