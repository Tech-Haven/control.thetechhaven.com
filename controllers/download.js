const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('node-ssh');

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const HOST = process.env.VPN_SERVER_HOST;
const USERNAME = process.env.VPN_SERVER_USERNAME;
const VPN_WEBHOOK_URL = process.env.VPN_WEBHOOK_URL;

const ssh = new NodeSSH();

// @desc    Create a send new vpn file to API server
// @route   GET /api/v1/downloads/vpn
// @access  Private (X-Auth-Token)
exports.createAndGetVpnFile = asyncHandler(async (req, res, next) => {
  const client = req.xAuthToken.user.name;
  await ssh.connect({
    host: HOST,
    username: USERNAME,
    privateKey: './.ssh/id_rsa',
  });

  await ssh.execCommand(
    `sudo MENU_OPTION=1 CLIENT=${client} PASS=1 ./openvpn-install.sh`
  );
  await ssh.getFile(
    path.join(__dirname, `../files/${client}.ovpn`),
    `/home/${USERNAME}/${client}.ovpn`
  );

  fs.access(path.join(__dirname, `../files/${client}.ovpn`), fs.F_OK, (err) => {
    if (err) {
      return next(new ErrorResponse('File not created', 500));
    }
  });

  await axios({
    method: 'post',
    url: VPN_WEBHOOK_URL,
    data: {
      content: `VPN Created by ${client}`,
    },
  });

  return res.status(200).json({ success: true, data: 'File created' });
});

// @desc    Download ovpn for user token
// @route   GET /api/v1/downloads
// @access  Private (X-Auth-Token)
exports.download = asyncHandler(async (req, res, next) => {
  const username = req.xAuthToken.user.name;
  const filepath = `./files/${username}.ovpn`;

  await axios({
    method: 'post',
    url: VPN_WEBHOOK_URL,
    data: {
      content: `VPN downloaded by ${username}`,
    },
  });

  res.status(200).download(filepath, (err) => {
    if (err) {
      if (!res.headersSent) {
        return res
          .status(404)
          .json({ success: false, error: 'File not found' });
      }
    }
  });
});
