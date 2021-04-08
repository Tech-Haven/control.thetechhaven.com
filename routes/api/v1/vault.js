const express = require('express');
const {
  getSecretsByUser,
  createSecret,
} = require('../../../controllers/vault/vault');

const router = express.Router();

const { vaultProtect } = require('../../../middleware/vaultAuth');

// Identity
router.route('/secrets/:user').get(vaultProtect, getSecretsByUser);
router.route('/secrets/:user').post(vaultProtect, createSecret);

module.exports = router;
