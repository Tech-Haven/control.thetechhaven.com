const axios = require('axios');

const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const applicationCredentialAuth = require('./helpers/applicationCredentialAuth');
const generateRandomPassword = require('./helpers/generateRandomPassword');
const passwordAuth = require('./helpers/passwordAuth');
const createSecret = require('../vault/helpers/createSecret');

const identityUrl = process.env.OPENSTACK_IDENTITY_URL;
const imageUrl = process.env.OPENSTACK_IMAGE_URL;
const computeUrl = process.env.OPENSTACK_COMPUTE_URL;

const MEMBER_ROLE_ID = process.env.OPENSTACK_MEMBER_ROLE_ID;

const sendRequest = async (method, url, token, options = { body: null }) => {
  if (method === 'post' && !options.body) {
    return { error: { status: 400, msg: 'Post request requires body option' } };
  }
  const config = {
    method,
    url,
    headers: {
      'X-Auth-Token': token,
      'Openstack-API-Version': 'compute 2.87',
    },
    data: method === 'post' ? options.body : null,
  };

  const response = await axios(config);
  return response.data;
};

// @desc    IDENTITY Authenticate via application credentials and return token
// @route   POST /api/v1/openstack/auth/tokens
// @access  Public
exports.applicationCredentialAuth = asyncHandler(async (req, res, next) => {
  const { id, secret } = req.body;

  if (!id || !secret) {
    return next(new ErrorResponse('Please provide an id and secret', 400));
  }

  const data = await applicationCredentialAuth(id, secret);
  return res
    .status(200)
    .header('x-subject-token', data.headers['x-subject-token'])
    .json({ success: true });
});

// @desc    IDENTITY Validate and show information for token
// @route   GET /api/v1/openstack/auth/tokens
// @access  Private
exports.validateToken = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, data: req.xAuthToken });
});

// @desc    IDENTITY Get all users
// @route   GET /api/v1/openstack/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${identityUrl}/users`,
    req.headers['x-auth-token']
  );

  if (req.query.name) {
    const queryUser = data.users.find((u) => u.name === req.query.name);

    if (!queryUser) {
      return next(new ErrorResponse(`User not found`, 404));
    }

    return res.status(200).json({ success: true, data: queryUser });
  }

  res.status(200).json({ success: true, data: data.users });
});

// @desc    Bootstraps a new user registration. Creates user, project, assigns role, creates application creds, and saves them to Vault
// @route   POST /api/v1/openstack/bootstrap
// @access  Private/Admin (X-Auth-Token & X-Vault-Token)
exports.bootstrapNewUser = asyncHandler(async (req, res, next) => {
  const { username, description } = req.body;

  if (!username) {
    return next(
      new ErrorResponse('Invalid request body. Expected username.', '400')
    );
  }

  // Create project for new user to get default_project_id
  const projectData = await sendRequest(
    'post',
    `${identityUrl}/projects`,
    req.headers['x-auth-token'],
    { body: { project: { name: username } } }
  );

  if (projectData.error) {
    return next(
      new ErrorResponse(projectData.error.msg, projectData.error.status)
    );
  }

  const projectId = projectData.project.id;

  const password = generateRandomPassword();

  const newUserData = await sendRequest(
    'post',
    `${identityUrl}/users`,
    req.headers['x-auth-token'],
    {
      body: {
        user: {
          default_project_id: projectId,
          domain_id: 'default',
          name: username,
          password,
          description,
        },
      },
    }
  );

  if (newUserData.error) {
    return next(
      new ErrorResponse(newUserData.error.msg, newUserData.error.status)
    );
  }

  const newUserId = newUserData.user.id;

  // Assign the new user _member_ role for their project
  const roleAssignData = await sendRequest(
    'put',
    `${identityUrl}/projects/${projectId}/users/${newUserId}/roles/${MEMBER_ROLE_ID}`,
    req.headers['x-auth-token']
  );

  if (roleAssignData.error) {
    return next(
      new ErrorResponse(roleAssignData.error.msg, roleAssignData.error.status)
    );
  }

  // Get token for new user
  const userTokenData = await passwordAuth(username, password);
  const userToken = userTokenData.headers['x-subject-token'];

  // Create the api application credentials
  const applicationCredData = await sendRequest(
    'post',
    `${identityUrl}/users/${newUserId}/application_credentials`,
    userToken,
    {
      body: {
        application_credential: {
          name: 'api',
        },
      },
    }
  );

  if (applicationCredData.error) {
    return next(
      new ErrorResponse(
        applicationCredData.error.msg,
        applicationCredData.error.status
      )
    );
  }

  const applicationCredentialId = applicationCredData.application_credential.id;
  const applicationCredentialSecret =
    applicationCredData.application_credential.secret;

  const secretData = await createSecret(
    applicationCredentialId,
    applicationCredentialSecret,
    username,
    req.headers['x-vault-token']
  );

  if (secretData.error) {
    return next(new ErrorResponse('Create secret failed', 500));
  }

  // Send password in response
  newUserData.user.password = password;
  newUserData.user.token = userToken;

  res.status(200).json({ success: true, data: newUserData.user });
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

  // Make sure user has a keypair before creating the server
  await sendRequest(
    'get',
    `${computeUrl}/os-keypairs/api-keypair`,
    req.headers['x-auth-token']
  );

  const body = {
    server: {
      name,
      imageRef,
      flavorRef,
      networks: 'auto',
      key_name: 'api-keypair',
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

  res.status(200).json({ success: true, data: data.server });
});

// @desc    COMPUTE Get SSH keypairs
// @route   GET /api/v1/openstack/os-keypairs
// @access  Private
exports.getSSHKeypairs = asyncHandler(async (req, res, next) => {
  const data = await sendRequest(
    'get',
    `${computeUrl}/os-keypairs/api-keypair`,
    req.headers['x-auth-token']
  );

  res.status(200).json({ success: true, data: data.keypair });
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
    `${computeUrl}/os-keypairs`,
    req.headers['x-auth-token'],
    {
      body,
    }
  );

  res.status(200).json({ success: true, data: data.keypair });
});

// @desc    COMPUTE Public key provided by user. Return the newly imported keypair.
// @route   POST /api/v1/openstack/os-keypairs/import
// @access  Private
exports.importSSHKeypair = asyncHandler(async (req, res, next) => {
  const { public_key } = req.body;

  if (!public_key) {
    return next(new ErrorResponse('Please provide a public_key', 400));
  }

  const body = {
    keypair: {
      name: `api-keypair`,
      public_key,
      type: 'ssh',
    },
  };

  const data = await sendRequest(
    'post',
    `${computeUrl}/os-keypairs`,
    req.headers['x-auth-token'],
    {
      body,
    }
  );

  res.status(200).json({ success: true, data: data.keypair });
});
