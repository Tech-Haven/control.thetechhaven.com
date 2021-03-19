const axios = require('axios');

const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const validateToken = require('./helpers/validateToken');

const adminToken = process.env.OPENSTACK_ADMIN_TOKEN; // TODO: Fetch admin token from vault instead of hardcode
const identityUrl = process.env.OPENSTACK_IDENTITY_URL;
const imageUrl = process.env.OPENSTACK_IMAGE_URL;
const computeUrl = process.env.OPENSTACK_COMPUTE_URL;

const sendRequest = async (
  method,
  url,
  token,
  options = { admin: false, body: null }
) => {
  if (method === 'post' && !options.body) {
    return { error: { status: 400, msg: 'Post request requires body option' } };
  }
  const config = {
    method,
    url,
    headers: {
      'X-Auth-Token': options.admin ? adminToken : token,
      'Openstack-API-Version': 'compute 2.87',
    },
    data: method === 'post' ? options.body : null,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return {
        error: { status: 400, msg: error.response.data.badRequest.message },
      };
    } else if (error.response && error.response.status === 401) {
      return { error: { status: 401, msg: error.response.data.error.message } };
    } else if (error.response && error.response.status === 404) {
      return {
        error: { status: 404, msg: error.response.data.itemNotFound.message },
      };
    } else if (error.response && error.response.status === 409) {
      return {
        error: {
          status: 409,
          msg: error.response.data.conflictingRequest.message,
        },
      };
    }
    return { error: { status: 500, msg: error } };
  }
};

// @desc    IDENTITY Authenticate via application credentials and return token
// @route   POST /api/v1/openstack/auth/tokens
// @access  Public
exports.applicationCredentialAuth = asyncHandler(async (req, res, next) => {
  const { id, secret } = req.body;
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
  return response.headers['x-subject-token'];
});

// @desc    IDENTITY Validate and show information for token
// @route   GET /api/v1/openstack/auth/tokens
// @access  Private
exports.validateToken = asyncHandler(async (req, res, next) => {
  const data = await validateToken(req.headers['x-auth-token']);

  res.status(200).json({ success: true, data: data.data.token });
});

// @desc    IDENTITY Get all users
// @route   GET /api/v1/openstack/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${identityUrl}/users`,
    req.headers['x-auth-token'],
    {
      admin: true,
    }
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  if (req.query.name) {
    const queryUser = data.users.find((u) => u.name === req.query.name);

    if (!queryUser) {
      return next(new ErrorResponse(`User not found`, 404));
    }

    return res.status(200).json({ success: true, data: queryUser });
  }

  res.status(200).json({ success: true, data: data.users });
});

// @desc    IMAGE Get all images
// @route   GET /api/v1/openstack/images
// @access  Private
exports.getImages = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${imageUrl}/images`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  if (req.query.name) {
    const queryImage = data.images.find(
      (i) => i.name === req.query.name.toLowerCase()
    );

    if (!queryImage) {
      return next(new ErrorResponse(`Image not found`, 404));
    }

    return res.status(200).json({ success: true, data: queryImage });
  }

  res.status(200).json({ success: true, data: data.images });
});

// @desc    IMAGE Get single image
// @route   GET /api/v1/openstack/images/:image_id
// @access  Private
exports.getImage = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${imageUrl}/images/${req.params.image_id}`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data });
});

// @desc    COMPUTE Get all flavors
// @route   GET /api/v1/openstack/flavors
// @access  Private
exports.getFlavors = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${computeUrl}/flavors`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  if (req.query.name) {
    const queryFlavor = data.flavors.find(
      (f) => f.name === req.query.name.toLowerCase()
    );

    if (!queryFlavor) {
      return next(new ErrorResponse(`Flavor not found`, 404));
    }

    return res.status(200).json({ success: true, data: queryFlavor });
  }

  res.status(200).json({ success: true, data: data.flavors });
});

// @desc    COMPUTE Get single flavor
// @route   GET /api/v1/openstack/flavors/:flavor_id
// @access  Private
exports.getFlavor = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${computeUrl}/flavors/${req.params.flavor_id}`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data });
});

// @desc    COMPUTE Get all servers
// @route   GET /api/v1/openstack/servers
// @access  Private
exports.getServers = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${computeUrl}/servers/detail`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data.servers });
});

// @desc    COMPUTE Get single server
// @route   GET /api/v1/openstack/servers/:server_id
// @access  Private
exports.getServer = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${computeUrl}/servers/${req.params.server_id}`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data.server });
});

// @desc    COMPUTE Create server
// @route   POST /api/v1/openstack/servers
// @access  Private
exports.createServer = asyncHandler(async (req, res, next) => {
  const { name, imageRef, flavorRef } = req.body;

  if (!name || !imageRef || !flavorRef) {
    return next(
      new ErrorResponse('Please provide a name, imageRef, and flavorRef', 400)
    );
  }

  const body = {
    server: {
      name,
      imageRef,
      flavorRef,
      networks: 'auto',
    },
  };
  const data = await sendRequest(
    'post',
    `${computeUrl}/servers`,
    req.headers['x-auth-token'],
    {
      body,
    }
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data.server });
});

// @desc    COMPUTE Get SSH keypairs
// @route   GET /api/v1/openstack/os-keypairs
// @access  Private
exports.getSSHKeypairs = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `https://lab.thetechhaven.com:8774/v2.1/os-keypairs`,
    req.headers['x-auth-token']
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  if (Array.isArray(data.keypairs) && !data.keypairs.length) {
    return next(new ErrorResponse('No keypairs found', 404));
  }

  res.status(200).json({ success: true, data: data.keypairs });
});

// @desc    COMPUTE No public key provided by user. Generate a new ssh key and return keypair + private key.
// @route   POST /api/v1/openstack/os-keypairs/create
// @access  Private
exports.createSSHKeypair = asyncHandler(async (req, res, next) => {
  const body = {
    keypair: {
      name: `api-keypair`,
      type: 'ssh',
    },
  };

  const data = await sendRequest(
    'post',
    `https://lab.thetechhaven.com:8774/v2.1/os-keypairs`,
    req.headers['x-auth-token'],
    {
      body,
    }
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data.keypair });
});

// @desc    COMPUTE Public key provided by user. Return the newly imported keypair.
// @route   POST /api/v1/openstack/os-keypairs/import
// @access  Private
exports.importSSHKeypair = asyncHandler(async (req, res, next) => {
  const { publicKey } = req.body;

  if (!publicKey) {
    return next(new ErrorResponse('Please provide a publicKey', 400));
  }

  const body = {
    keypair: {
      name: `api-keypair`,
      publicKey,
      type: 'ssh',
    },
  };

  const data = await sendRequest(
    'post',
    `https://lab.thetechhaven.com:8774/v2.1/os-keypairs`,
    req.headers['x-auth-token'],
    {
      body,
    }
  );

  if (data.error) {
    return next(new ErrorResponse(data.error.msg, data.error.status));
  }

  res.status(200).json({ success: true, data: data.keypair });
});
