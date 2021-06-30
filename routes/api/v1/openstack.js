const express = require('express');
const {
  applicationCredentialAuth,
  validateToken,
  getUsers,
  bootstrapNewUser,
  getImages,
  getImage,
  getFlavors,
  getFlavor,
  getServers,
  getServer,
  createServer,
  getSSHKeypairs,
  createSSHKeypair,
  importSSHKeypair,
  getAppCreds,
} = require('../../../controllers/openstack/openstack');

const router = express.Router();

const { protect, adminOnly } = require('../../../middleware/openstackAuth');

// Custom
router.route('/bootstrap').post(adminOnly, bootstrapNewUser);
router.route('/app-creds/:username_id').get(adminOnly, getAppCreds);

// Identity
router.route('/auth/tokens').post(applicationCredentialAuth);
router.route('/auth/tokens').get(protect, validateToken);
router.route('/users').get(adminOnly, getUsers);

// Image
router.route('/images').get(protect, getImages);
router.route('/images/:image_id').get(protect, getImage);

// Compute
router.route('/flavors').get(protect, getFlavors);
router.route('/flavors/:flavor_id').get(protect, getFlavor);
router.route('/servers').get(protect, getServers);
router.route('/servers/:server_id').get(protect, getServer);
router.route('/servers').post(protect, createServer);
router.route('/os-keypairs').get(protect, getSSHKeypairs);
router.route('/os-keypairs/create').post(protect, createSSHKeypair);
router.route('/os-keypairs/import').post(protect, importSSHKeypair);

module.exports = router;
