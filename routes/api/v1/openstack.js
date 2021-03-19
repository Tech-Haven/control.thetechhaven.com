const express = require('express');
const {
  applicationCredentialAuth,
  validateToken,
  getUsers,
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
} = require('../../../controllers/openstack/openstack');

const router = express.Router();

const { protect, adminOnly } = require('../../../middleware/openstackAuth');

// Identity
router.route('/auth/tokens').post(applicationCredentialAuth);
router.route('/auth/tokens').get(protect, validateToken);
router.route('/users').get(protect, adminOnly, getUsers);

// Image
router.route('/images').get(protect, getImages);
router.route('/images/:image_id').get(protect, getImage);

// Compute
router.route('/flavors').get(getFlavors);
router.route('/flavors/:flavor_id').get(getFlavor);
router.route('/servers').get(getServers);
router.route('/servers/:server_id').get(getServer);
router.route('/servers').post(createServer);
router.route('/os-keypairs').get(getSSHKeypairs);
router.route('/os-keypairs/create').post(createSSHKeypair);
router.route('/os-keypairs/import').post(importSSHKeypair);

module.exports = router;
