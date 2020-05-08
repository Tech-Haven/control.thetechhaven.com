const fetch = require('node-fetch');
const axios = require('axios')
const FormData = require('form-data');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const xml2js = require('xml2js');
const sshpk = require('sshpk')
const parser = new xml2js.Parser();

const LabUser = require('../models/LabUser')

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const scope = process.env.SCOPE;
const redirect_uri = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
const discord_token_uri = `https://discordapp.com/api/oauth2/token`;
const ONE_URI = 'http://10.10.1.3:2633/RPC2'

const builder = new xml2js.Builder({
  renderOpts: { 'pretty': false }
})

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

// labLogin()
// PARAMS: username, password
// RETURNS: userId, username, token
const labLogin = async (username, password) => {
  // Check if user already has a token 
  let loginToken = await checkForLoginToken(username, password)

  if (!loginToken) {
    const data = builder.buildObject({
      'methodCall': {
        'methodName': 'one.user.login',
        'params': {
          'param': [
            {
              'value': `${username}:${password}`
            },
            {
              'value': `${username}`
            },
            {
              'value': ''
            },
            {
              'value': {
                'int': -1
              }
            },
            {
              'value': {
                'int': -1
              }
            }
          ]
        }
      }
    })

    const config = {
      method: 'post',
      url: `${ONE_URI}`,
      headers: { 'Content-Type': 'application/xml' },
      data: data
    }

    try {
      const r = await axios(config)
      const result = await parser.parseStringPromise(r.data);
      loginToken = result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0];
    } catch (error) {
      console.error(error)
      return { error }
    }
  }

  if (loginToken.error) {
    return { error: loginToken.error }
  }

  const userObject = await getUserInfo(username, loginToken)

  if (userObject.error) {
    return { error: userObject.error }
  }

  let query = {
    userID: userObject.USER.ID[0],
    username: userObject.USER.NAME[0],
    login_token: loginToken
  }

  try {
    const u = await LabUser.findOneAndUpdate({ userID: userObject.USER.ID[0] }, query, {
      upsert: true,
      new: true
    });
    return u;
  } catch (error) {
    return { error }
  }
}


// checkForLoginToken()
// PARAMS: username, password
// RETURN: login token if there is one

const checkForLoginToken = async (username, password) => {
  const userInfo = await getUserInfo(username, password)

  if (userInfo.error) {
    return { error: userInfo.error }
  }

  const keys = Object.keys(userInfo.USER);

  if (!keys.includes('LOGIN_TOKEN')) {
    return
  }

  return userInfo.USER.LOGIN_TOKEN[0].TOKEN[0]
}

const getSSHKey = async (username, token) => {
  const user = await getUserInfo(username, token);

  if (user.error) {
    return { error: user.error }
  }

  const sshKey = user.USER.TEMPLATE[0].SSH_PUBLIC_KEY[0];
  return sshKey;
}

const updateSSHKey = async (username, token, key) => {

  // Verify input is a ssh public key
  try {
    sshpk.parseKey(key, 'ssh')
  } catch (error) {
    return { error: 'Invalid key' }
  }

  const user = await getUserInfo(username, token);

  if (user.error) {
    console.error(user.error)
    return { error: user.error }
  }

  const userID = user.USER.ID[0];

  const data = builder.buildObject({
    'methodCall': {
      'methodName': 'one.user.update',
      'params': {
        'param': [
          {
            'value': `${username}:${token}`
          },
          {
            'value': {
              'int': `${userID}`
            }
          },
          {
            'value': `SSH_PUBLIC_KEY="${key}"`
          },
          {
            'value': {
              'int': `0`
            }
          }
        ]
      }
    }
  })

  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data
  }


  try {
    const r = await axios(config)
    const result = await parser.parseStringPromise(r.data);

    if (result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0] == 0) {
      return { error: { msg: result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0] } }
    }

    const bool = result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0]
    return bool
  } catch (error) {
    console.error(error)
    return { error: { msg: error } }
  }
}

const createVm = async (username, token, templateId, vmName) => {
  const data = builder.buildObject({
    'methodCall': {
      'methodName': 'one.template.instantiate',
      'params': {
        'param': [
          {
            'value': `${username}:${token}`
          },
          {
            'value': {
              'int': `${templateId}`
            }
          },
          {
            'value': `${vmName}`
          },
          {
            'value': {
              'boolean': `0`
            }
          },
          {
            'value': ''
          },
          {
            'value': {
              'boolean': `0`
            }
          },
        ]
      }
    }
  })

  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data
  }


  try {
    const r = await axios(config)
    const result = await parser.parseStringPromise(r.data);

    if (result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0] == 0) {
      return { error: { msg: result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0] } }
    }

    const vmId = result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].i4[0]
    return vmId
  } catch (error) {
    console.error(error)
    return { error: { msg: error } }
  }
}

const getTemplateInfo = async (username, token) => {
  const data = builder.buildObject({
    'methodCall': {
      'methodName': 'one.templatepool.info',
      'params': {
        'param': [
          {
            'value': `${username}:${token}`
          },
          {
            'value': {
              'int': `-1`
            }
          },
          {
            'value': {
              'int': `-1`
            }
          },
          {
            'value': {
              'int': `-1`
            }
          }
        ]
      }
    }
  })

  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data
  }


  try {
    const r = await axios(config)
    const result = await parser.parseStringPromise(r.data);

    if (result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0] == 0) {
      return { error: { msg: result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0] } }
    }

    const stringResult = await parser.parseStringPromise(result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0])
    return stringResult;
  } catch (error) {
    console.error(error)
    return { error: { msg: error } }
  }
}




// getUserInfo()
// PARAMS: username, token
// RETURN: User info from lab
const getUserInfo = async (username, token) => {
  const data = builder.buildObject({
    'methodCall': {
      'methodName': 'one.user.info',
      'params': {
        'param': [
          {
            'value': `${username}:${token}`
          },
          {
            'value': {
              'int': `-1`
            }
          }
        ]
      }
    }
  })

  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data
  }

  try {
    const r = await axios(config)
    const result = await parser.parseStringPromise(r.data);

    if (result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0] == 0) {
      return { error: { msg: result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0] } }
    }

    const stringResult = await parser.parseStringPromise(result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0])
    return stringResult;
  } catch (error) {
    console.error(error)
    return { error: { msg: error } }
  }
}


// getVmInfo()
// PARAMS: username, token, vmid
// RETURN: Information on a VM
const getVmInfo = async (username, token, vmid) => {
  const data = builder.buildObject({
    'methodCall': {
      'methodName': 'one.vm.info',
      'params': {
        'param': [
          {
            'value': `${username}:${token}`
          },
          {
            'value': {
              'int': `${vmid}`
            }
          }
        ]
      }
    }
  })

  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data
  }

  try {
    const r = await axios(config)
    const result = await parser.parseStringPromise(r.data);

    if (result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0].boolean[0] == 0) {
      return { error: { msg: result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0] } }
    }

    const stringResult = await parser.parseStringPromise(result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0])
    return stringResult;
  } catch (error) {
    console.error(error)
    return { error: { msg: error } }
  }
}

exports.updateUser = updateUser;
exports.getMe = getMe;
exports.exchangeCode = exchangeCode;
exports.refreshToken = refreshToken;
exports.getGuildMember = getGuildMember;
exports.getStaffRoles = getStaffRoles;
exports.getGuildMembers = getGuildMembers;
exports.checkIfGuildMember = checkIfGuildMember;
exports.checkIfStaff = checkIfStaff;
exports.labLogin = labLogin;
exports.checkForLoginToken = checkForLoginToken;
exports.getSSHKey = getSSHKey;
exports.updateSSHKey = updateSSHKey;
exports.createVm = createVm;
exports.getTemplateInfo = getTemplateInfo;
exports.getUserInfo = getUserInfo;
exports.getVmInfo = getVmInfo;