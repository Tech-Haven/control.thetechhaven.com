const express = require('express')
const { check, validationResult } = require('express-validator')
const axios = require('axios')
const xml2js = require('xml2js');

const labAuth = require('../../middleware/labAuth')
const LabUser = require('../../models/LabUser');
const { checkForLoginToken, getUserInfo, getVmInfo } = require('../../utils/utils')

const router = express.Router();

const ONE_URI = 'http://10.10.1.3:2633/RPC2'

const parser = new xml2js.Parser();

const builder = new xml2js.Builder({
  renderOpts: { 'pretty': false }
})


router.post('/login', [
  check('username', 'Please enter your OpenNebula username').exists(),
  check('password', 'Plese enter your OpenNebula password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  // Check if user already has a token 
  const loginToken = await checkForLoginToken(req.body.username, req.body.password)

  if (!loginToken) {
    const data = builder.buildObject({
      'methodCall': {
        'methodName': 'one.user.login',
        'params': {
          'param': [
            {
              'value': `${req.body.username}:${req.body.password}`
            },
            {
              'value': `${req.body.username}`
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
      const lab_token = result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0];

      const userObject = await getUserInfo(req.body.username, lab_token)

      if (userObject.error) {
        return res.status(400).send(userObject.error)
      }

      req.session.lab_username = req.body.username
      req.session.lab_token = lab_token;

      let query = {
        userID: userObject.USER.ID[0],
        username: userObject.USER.NAME[0],
        login_token: lab_token
      }

      await LabUser.findOneAndUpdate({ userID: userObject.USER.ID[0] }, query, {
        upsert: true,
        new: true
      });

      return res.status(200).send('Successfully logged in')
    } catch (error) {
      console.log(error)
      return res.status(400).send(error)
    }
  }

  if (loginToken.error) {
    console.log(loginToken.error)
    return res.status(400).send(loginToken.error)
  }

  const userObject = await getUserInfo(req.body.username, loginToken)

  if (userObject.error) {
    return res.status(400).send(userObject.error)
  }

  req.session.lab_username = req.body.username
  req.session.lab_token = loginToken

  let query = {
    userID: userObject.USER.ID[0],
    username: userObject.USER.NAME[0],
    login_token: loginToken
  }

  await LabUser.findOneAndUpdate({ userID: userObject.USER.ID[0] }, query, {
    upsert: true,
    new: true
  });

  res.status(200).send('Successfully logged in')
})

router.get('/user/info', labAuth, async (req, res) => {
  const userObject = await getUserInfo(req.session.lab_username, req.session.lab_token)

  if (userObject.error) {
    return res.status(400).send(userObject.error)
  }

  res.status(200).send(userObject)
})

router.post('/vm/info', [
  check('vmid', 'Please enter a VM ID').exists().isNumeric()
], labAuth, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const vmObject = await getVmInfo(req.session.lab_username, req.session.lab_token, req.body.vmid)

  if (vmObject.error) {
    return res.status(400).send(vmObject.error)
  }

  res.status(200).send(vmObject)
})

module.exports = router;