const express = require('express');
const {
  login,
  updateSSHKey,
  getUserInfo,
  getTemplatePoolInfo,
  createVm,
  getAllVmInfo,
  getVmInfo,
} = require('../../../controllers/lab');

const router = express.Router();

router.route('/login').post(login);

router.route('/user/ssh').put(updateSSHKey);

router.route('/user/info').get(getUserInfo);

router.route('/templatepool/info').get(getTemplatePoolInfo);

router.route('/vm/create').post(createVm);

router.route('/vm/info').get(getAllVmInfo);

router.route('/vm/info/:vmid').get(getVmInfo);

module.exports = router;
