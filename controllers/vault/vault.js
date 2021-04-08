const axios = require('axios');
const https = require('https');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');

const createSecret = require('./helpers/createSecret');

const VAULT_URL = process.env.VAULT_URL;

const sendRequest = async (
  method,
  url,
  token = '',
  options = { body: null }
) => {
  if (method === 'post' && !options.body) {
    return { error: { status: 400, msg: 'Post request requires body option' } };
  }
  const agent = new https.Agent({ rejectUnauthorized: false });
  const config = {
    method,
    url,
    headers: {
      'X-Vault-Token': token,
    },
    httpsAgent: agent,
    data: method === 'post' ? options.body : null,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(error);
    if (error.response.status === 400) {
      return {
        error: {
          status: 400,
          msg: error.response.data.errors[0],
        },
      };
    } else if (error.response.status === 403) {
      return {
        error: { status: 403, msg: error.response.data.errors[0] },
      };
    } else if (error.response.status === 404) {
      return {
        error: {
          status: 404,
          msg: 'Not found',
        },
      };
    }
    return { error: { status: 500, msg: error } };
  }
};

// @desc    Get secrets for the passed in user
// @route   GET /api/v1/vault/secrets/:user
// @access  Private (X-Vault-Token)
exports.getSecretsByUser = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${VAULT_URL}/v1/lab.thetechhaven.com/data/${req.params.user}`,
    req.headers['x-vault-token'],
    {
      body: req.body,
    }
  );
  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  const secrets = data.data.data;

  return res.status(200).json({ success: true, data: secrets });
});

// @desc    Create secrets for the passed in user
// @route   POST /api/v1/vault/secrets/:user
// @access  Private (X-Vault-Token)
exports.createSecret = asyncHandler(async (req, res, next) => {
  const {
    api_application_credential_id,
    api_application_credential_secret,
  } = req.body;

  if (!api_application_credential_id || !api_application_credential_secret) {
    return next(
      new ErrorResponse(
        'Invalid request body. Expected api_application_credential_id and api_application_credential_secret',
        '400'
      )
    );
  }

  const data = await createSecret(
    api_application_credential_id,
    api_application_credential_secret,
    req.params.user,
    req.headers['x-vault-token']
  );

  if (data.error) {
    return next(new ErrorResponse('Create secret failed', 500));
  }

  return res.status(200).json({ success: true, data });
});
