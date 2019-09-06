const { refreshToken, getMe } = require('../utils/utils');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  if (!req.session.access_token) {
    // Use refresh token to create new access token
    if (!req.session.refresh_token || !res.session.discordId) {
      return res
        .status(401)
        .json({ errors: [{ msg: `Unauthorized. Please login.` }] });
    }
    const user = await User.findById(req.session.discordId);
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: `Invalid user. Please login.` }] });
    }
    const isMatch = await bcrypt.compare(
      req.session.refresh_token,
      user.refresh_hash
    );
    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid token. Please login.' }] });
    }
    try {
      const response = await refreshToken(req.session.refresh_token);
      const { access_token, refresh_token } = response;
      const user = await updateUser(access_token, refresh_token);

      req.session.access_token = access_token;
      req.session.refresh_token = refresh_token;
      req.session.discordId = user.id;
      next();
    } catch (err) {
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
  try {
    // Check if access token is still authorized
    const me = await getMe(req.session.access_token);
    if (me.error) {
      return res
        .status(me.error.status)
        .json({ errors: [{ msg: me.error.msg }] });
    }
    next();
  } catch (err) {
    res.status(500).json('Server error');
    console.error(err);
  }
};
