const axios = require('axios');
const xml2js = require('xml2js');
const sshpk = require('sshpk');

const parser = new xml2js.Parser();

const LabUser = require('../models/LabUser');

const ONE_URI = process.env.ONE_URI;

const builder = new xml2js.Builder({
  renderOpts: { pretty: false },
});

const sendToOpenNebulaApi = async (data) => {
  const config = {
    method: 'post',
    url: `${ONE_URI}`,
    headers: { 'Content-Type': 'application/xml' },
    data: data,
  };

  try {
    const r = await axios(config);
    const result = await parser.parseStringPromise(r.data);

    if (
      result.methodResponse.params[0].param[0].value[0].array[0].data[0]
        .value[0].boolean[0] == 0
    ) {
      return {
        error: {
          msg:
            result.methodResponse.params[0].param[0].value[0].array[0].data[0]
              .value[1].string[0],
        },
      };
    }

    return result;
  } catch (error) {
    console.error(error);
    return { error: { msg: error } };
  }
};

// labLogin()
// PARAMS: username, password
// RETURNS: userId, username, token
const labLogin = async (username, password) => {
  // Check if user already has a token
  let loginToken = await checkForLoginToken(username, password);

  if (!loginToken) {
    const data = builder.buildObject({
      methodCall: {
        methodName: 'one.user.login',
        params: {
          param: [
            {
              value: `${username}:${password}`,
            },
            {
              value: `${username}`,
            },
            {
              value: '',
            },
            {
              value: {
                int: -1,
              },
            },
            {
              value: {
                int: -1,
              },
            },
          ],
        },
      },
    });

    const result = await sendToOpenNebulaApi(data);

    if (result.error) {
      return result;
    }

    loginToken =
      result.methodResponse.params[0].param[0].value[0].array[0].data[0]
        .value[1].string[0];
  }

  if (loginToken.error) {
    return { error: loginToken.error };
  }

  const userObject = await getUserInfo(username, loginToken);

  if (userObject.error) {
    return { error: userObject.error };
  }

  let query = {
    userID: userObject.USER.ID[0],
    username: userObject.USER.NAME[0],
    login_token: loginToken,
  };

  try {
    const u = await LabUser.findOneAndUpdate(
      { userID: userObject.USER.ID[0] },
      query,
      {
        upsert: true,
        new: true,
      }
    );
    return u;
  } catch (error) {
    return { error };
  }
};

const labRegister = async (username, password) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.user.allocate',
      params: {
        param: [
          {
            value: `${process.env.THLAB_API_USER}:${process.env.THLAB_API_TOKEN}`,
          },
          {
            value: `${username}`,
          },
          {
            value: `${password}`,
          },
          {
            value: {},
          },
          {
            value: {
              array: [
                {
                  data: {},
                },
              ],
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  status =
    result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[0]
      .boolean[0];

  return status;
};

// checkForLoginToken()
// PARAMS: username, password
// RETURN: login token if there is one

const checkForLoginToken = async (username, password) => {
  const userInfo = await getUserInfo(username, password);

  if (userInfo.error) {
    return { error: userInfo.error };
  }

  const keys = Object.keys(userInfo.USER);

  if (!keys.includes('LOGIN_TOKEN')) {
    return;
  }

  return userInfo.USER.LOGIN_TOKEN[0].TOKEN[0];
};

const getSSHKey = async (username, token) => {
  const user = await getUserInfo(username, token);

  if (user.error) {
    return { error: user.error };
  }

  if (!user.USER.TEMPLATE[0].SSH_PUBLIC_KEY) {
    return { error: 'User does not have a SSH key' };
  }

  const sshKey = user.USER.TEMPLATE[0].SSH_PUBLIC_KEY[0];
  return sshKey;
};

const updateSSHKey = async (username, token, key) => {
  // Verify input is a ssh public key
  try {
    sshpk.parseKey(key, 'ssh');
  } catch (error) {
    return { error: 'Invalid key' };
  }

  const user = await getUserInfo(username, token);

  if (user.error) {
    console.error(user.error);
    return { error: user.error };
  }

  const userID = user.USER.ID[0];

  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.user.update',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `${userID}`,
            },
          },
          {
            value: `SSH_PUBLIC_KEY="${key}"`,
          },
          {
            value: {
              int: `0`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  return result.methodResponse.params[0].param[0].value[0].array[0].data[0]
    .value[0].boolean[0];
};

const createVm = async (username, token, templateId, vmName) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.template.instantiate',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `${templateId}`,
            },
          },
          {
            value: `${vmName}`,
          },
          {
            value: {
              boolean: `0`,
            },
          },
          {
            value: '',
          },
          {
            value: {
              boolean: `0`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  return result.methodResponse.params[0].param[0].value[0].array[0].data[0]
    .value[1].i4[0];
};

const getTemplateInfo = async (username, token) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.templatepool.info',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `-1`,
            },
          },
          {
            value: {
              int: `-1`,
            },
          },
          {
            value: {
              int: `-1`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  const stringResult = await parser.parseStringPromise(
    result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1]
      .string[0]
  );
  return stringResult;
};

// getUserInfo()
// PARAMS: username, token
// RETURN: User info from lab
const getUserInfo = async (username, token) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.user.info',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `-1`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  const stringResult = await parser.parseStringPromise(
    result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1]
      .string[0]
  );
  return stringResult;
};

// getVmInfo()
// PARAMS: username, token, vmid
// RETURN: Information on a VM
const getAllVmInfo = async (username, token) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.vmpool.info',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `-1`,
            },
          },
          {
            value: {
              int: `-1`,
            },
          },
          {
            value: {
              int: `-1`,
            },
          },
          {
            value: {
              int: `-1`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  const stringResult = await parser.parseStringPromise(
    result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1]
      .string[0]
  );
  return stringResult;
};

// getVmInfo()
// PARAMS: username, token, vmid
// RETURN: Information on a VM
const getVmInfo = async (username, token, vmid) => {
  const data = builder.buildObject({
    methodCall: {
      methodName: 'one.vm.info',
      params: {
        param: [
          {
            value: `${username}:${token}`,
          },
          {
            value: {
              int: `${vmid}`,
            },
          },
        ],
      },
    },
  });

  const result = await sendToOpenNebulaApi(data);

  if (result.error) {
    return result;
  }

  const stringResult = await parser.parseStringPromise(
    result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1]
      .string[0]
  );
  return stringResult;
};

const getTemplateFields = (templatesObject) => {
  let idField = '';
  let nameField = '';
  const templates = templatesObject.VMTEMPLATE_POOL.VMTEMPLATE;

  const compare = (a, b) => {
    let comparison = 0;
    if (a.ID[0] > b.ID[0]) {
      comparison = 1;
    } else if (a.ID[0] < b.ID[0]) {
      comparison = -1;
    }
    return comparison;
  };

  templates.sort(compare);

  for (let i = 0; i < templates.length; i++) {
    idField += `${templates[i].ID[0]}\n`;
    nameField += `${templates[i].NAME[0]}\n`;
  }
  return { idField, nameField };
};

exports.labLogin = labLogin;
exports.labRegister = labRegister;
exports.checkForLoginToken = checkForLoginToken;
exports.getSSHKey = getSSHKey;
exports.updateSSHKey = updateSSHKey;
exports.createVm = createVm;
exports.getTemplateInfo = getTemplateInfo;
exports.getUserInfo = getUserInfo;
exports.getAllVmInfo = getAllVmInfo;
exports.getVmInfo = getVmInfo;
exports.getTemplateFields = getTemplateFields;
