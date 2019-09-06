const express = require('express');
const auth = require('../../middleware/auth');
const { exchangeCode, updateUser, getMe } = require('../../utils/utils');

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const SCOPE = process.env.SCOPE;
const REDIRECT_URI = process.env.REDIRECT_URI;
const DASHBOARD_URI = process.env.DASHBOARD_URI;

router.get('/login', (req, res) => {
  res.status(200).json({ CLIENT_ID, SCOPE, REDIRECT_URI });
});

router.get('/oauth', async (req, res) => {
  if (!req.query.code) {
    return res.status(400).json({ errors: [{ msg: 'Invalid access code' }] });
  }
  const response = await exchangeCode(req.query.code);
  const { access_token, refresh_token } = response;
  const user = await updateUser(access_token, refresh_token);

  req.session.access_token = access_token;
  req.session.refresh_token = refresh_token;
  req.session.discordId = user.id;

  res.redirect(DASHBOARD_URI);
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.json(`Error logging out`, err);
      }
      return res.json('Logged out');
    });
  } else {
    return res.json(`You're already logged out!`);
  }
});

router.get('/users/@me', auth, async (req, res) => {
  try {
    const me = await getMe(req.session.access_token);
    const { id, username, discriminator, avatar } = me;
    res.json({ id, username, discriminator, avatar });
  } catch (err) {
    res.status(500).json('Server error');
    console.error(err);
  }
});

module.exports = router;
