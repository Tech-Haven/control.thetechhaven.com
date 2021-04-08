const axios = require('axios');
const https = require('https');
const VAULT_URL = process.env.VAULT_URL;

const createSecret = async (id, secret, user, token) => {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const config = {
      method: 'post',
      url: `${VAULT_URL}/v1/lab.thetechhaven.com/data/${user}`,
      headers: {
        'X-Vault-Token': token,
      },
      httpsAgent: agent,
      data: {
        data: {
          application_credential_id: id,
          application_credential_secret: secret,
        },
      },
    };

    const response = await axios(config);

    return response.data.data;
  } catch (error) {
    return { error };
  }
};

module.exports = createSecret;
