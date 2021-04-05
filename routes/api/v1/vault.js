const express = require('express');
const {
  getSecretsByUser,
  createSecret,
} = require('../../../controllers/vault/vault');

const router = express.Router();

const { protect } = require('../../../middleware/openstackAuth');

// Identity
router.route('/secrets/:user').get(getSecretsByUser);
router.route('/secrets/:user').post(createSecret);

module.exports = router;
