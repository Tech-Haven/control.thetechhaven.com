const express = require('express')
const { check, validationResult } = require('express-validator')
const axios = require('axios')
const xml2js = require('xml2js');

const labAuth = require('../../middleware/labAuth')
const { checkForLoginToken, getVmInfo } = require('../../utils/utils')

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

  // Check is user already has a token 
  const loginToken = await checkForLoginToken(req.body.username, req.body.password)

  if (loginToken.error) {
    console.log(loginToken.error)
    return res.status(400).send(loginToken.error)
  }

  if (!loginToken) {
    const data = builder.buildObject({
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
      req.session.lab_username = req.body.username
      req.session.lab_token = result.methodResponse.params[0].param[0].value[0].array[0].data[0].value[1].string[0];
      return res.status(200).send('Successfully logged in')
    } catch (error) {
      console.log(error)
      return res.status(400).send(error)
    }
  }
  req.session.lab_username = req.body.username
  req.session.lab_token = loginToken
  res.status(200).send('Successfully logged in')
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