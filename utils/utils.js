const fetch = require('node-fetch');
const FormData = require('form-data');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const scope = process.env.SCOPE;
const redirect_uri = process.env.REDIRECT_URI;
const discord_token_uri = `https://discordapp.com/api/oauth2/token`;

// updateUser()
// PARAMS: access_token, refresh_token
// RETURN: User information from the database
const updateUser = async (access_token, refresh_token) => {
  const me = await getMe(access_token);
  const { id, username, discriminator, avatar } = me;
  const salt = await bcrypt.genSalt(10);
  const refresh_hash = await bcrypt.hash(refresh_token, salt);

  let query = {
    _id: id,
    username,
    discriminator,
    avatar,
    refresh_hash
  };

  let u = await User.findOneAndUpdate({ _id: id }, query, {
    upsert: true,
    new: true
  });
  return u;
};

// exchangeCode()
// PARAMS: access_code
// RETURN: Access token response
const exchangeCode = async access_code => {
  const data = new FormData();

  data.append(`client_id`, CLIENT_ID);
  data.append(`client_secret`, CLIENT_SECRET);
  data.append(`grant_type`, 'authorization_code');
  data.append(`redirect_uri`, redirect_uri);
  data.append(`scope`, scope);
  data.append(`code`, access_code);

  const r = await fetch(discord_token_uri, {
    method: 'POST',
    body: data
  });

  return r.json();
};

// refreshToken()
// PARAMS: refresh_token
// RETURN: Access token response
const refreshToken = async refresh_token => {
  const data = new FormData();
  data.append(`client_id`, CLIENT_ID);
  data.append(`client_secret`, CLIENT_SECRET);
  data.append(`grant_type`, 'refresh_token');
  data.append(`redirect_uri`, redirect_uri);
  data.append(`scope`, scope);
  data.append(`refresh_token`, refresh_token);

  const r = await fetch(discord_token_uri, {
    method: 'POST',
    body: data
  });

  return r.json();
};

const getMe = async access_token => {
  const r = await fetch(`https://discordapp.com/api/users/@me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
  if (r.status === 401) {
    return { error: { status: 401, msg: '401: Unauthorized' } };
  }
  return r.json();
};

exports.updateUser = updateUser;
exports.getMe = getMe;
exports.exchangeCode = exchangeCode;
exports.refreshToken = refreshToken;
