const fetch = require('node-fetch');
const FormData = require('form-data');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const scope = process.env.SCOPE;
const redirect_uri = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
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

// getMe()
// PARAMS: access_token
// RETURN: User information (id, username, discriminator, avatar)
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

const getGuildMembers = async () => {
  const r = await fetch(
    `https://discordapp.com/api/guilds/${GUILD_ID}/members`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`
      }
    }
  );

  const response = await r.json();
  if (r.status === 404) {
    return { error: { status: r.status, msg: response.message } };
  }
  return response;
};

// isGuildMember()
// PARAMS: userId
// RETURN: Boolean value if user is in the server or not
const checkIfGuildMember = async userId => {
  const guildMember = await getGuildMember(userId);
  if (!guildMember.error) {
    return true;
  }
  return false;
};

// getGuildMember()
// PARAMS: userId
// RETURN: Guild member's information (user object, nickname, roles, when they joined)
const getGuildMember = async userId => {
  if (!userId) {
    return { error: { status: 401, msg: '401: Unauthorized.' } };
  }
  const r = await fetch(
    `https://discordapp.com/api/guilds/${GUILD_ID}/members/${userId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`
      }
    }
  );
  const response = await r.json();
  if (r.status === 404) {
    return { error: { status: r.status, msg: response.message } };
  }
  return response;
};

// isStaff()
// PARAMS: userId
// RETURN: Boolean value if the user is staff or not
const checkIfStaff = async userId => {
  const guildMember = await getGuildMember(userId);
  if (!guildMember.error) {
    const staffRoles = await getStaffRoles();
    const staff = staffRoles.some(r => {
      return guildMember.roles.includes(r.id);
    });
    if (staff) {
      return true;
    }
    return false;
  }
  return false;
};

// getStaffRoles()
// PARAMS: NA
// RETURN: Staff roles for the server.
// NOTE: Role names are hardcoded. Come up with a better way to check staff role IDs.
const getStaffRoles = async () => {
  const r = await fetch(`https://discordapp.com/api/guilds/${GUILD_ID}/roles`, {
    method: 'GET',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`
    }
  });
  const guildRoles = await r.json();
  var staffRoleFilter = ['Staff', 'Root', 'Server Admin'];
  const staffRoles = guildRoles.filter(role => {
    return staffRoleFilter.includes(role.name);
  });
  return staffRoles;
};

exports.updateUser = updateUser;
exports.getMe = getMe;
exports.exchangeCode = exchangeCode;
exports.refreshToken = refreshToken;
exports.getGuildMember = getGuildMember;
exports.getStaffRoles = getStaffRoles;
exports.getGuildMembers = getGuildMembers;
exports.checkIfGuildMember = checkIfGuildMember;
exports.checkIfStaff = checkIfStaff;
