const express = require('express');
const {
  download,
  createAndGetVpnFile,
} = require('../../../controllers/download');

const router = express.Router();

const { protect } = require('../../../middleware/openstackAuth');

router.route('').get(protect, download);
router.route('/vpn').get(protect, createAndGetVpnFile);

module.exports = router;
