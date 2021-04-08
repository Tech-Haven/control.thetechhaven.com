const asyncHandler = require('../../../middleware/async');
const applicationCredentialAuth = require('./applicationCredentialAuth');

const ID = process.env.OPENSTACK_ADMIN_API_APPLICATION_CREDS_ID;
const SECRET = process.env.OPENSTACK_ADMIN_API_APPLICATION_CREDS_SECRET;

const getAdminToken = asyncHandler(async () => {
  const authRes = await applicationCredentialAuth(ID, SECRET);
  const token = authRes.headers['x-subject-token'];
  return token;
});

module.exports = getAdminToken;
