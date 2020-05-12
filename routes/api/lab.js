const express = require('express')
const { check, param, validationResult } = require('express-validator')
const axios = require('axios')
const xml2js = require('xml2js');

const labAuth = require('../../middleware/labAuth')
const LabUser = require('../../models/LabUser');
const { labLogin, updateSSHKey, createVm, getTemplateInfo, getUserInfo, getVmInfo } = require('../../utils/utils')

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

  try {
    const userObject = await labLogin(req.body.username, req.body.password);

    if (userObject.error) {
      console.error(userObject.error)
      return res.status(400).send(userObject.error)
    }

    const { userID, username, login_token } = userObject

    req.session.lab_username = username;
    req.session.lab_token = login_token;

    return res.status(200).send({ userID, username })

  } catch (error) {
    console.error(error)
    res.status(500).send(`Error! Check server logs`)
  }
})

router.post('/user/ssh', labAuth, async (req, res) => {
  const sshUpdated = await updateSSHKey(req.session.lab_username, req.session.lab_token, req.body.sshKey)

  if (sshUpdated.error) {
    return res.status(400).send(sshUpdated.error)
  }

  res.status(200).send('SSH Key Updated!')
})

router.get('/user/info', labAuth, async (req, res) => {
  const userObject = await getUserInfo(req.session.lab_username, req.session.lab_token)

  if (userObject.error) {
    return res.status(400).send(userObject.error)
  }

  res.status(200).send(userObject)
})

router.get('/template/info', labAuth, async (req, res) => {
  const templateObject = await getTemplateInfo(req.session.lab_username, req.session.lab_token)

  if (templateObject.error) {
    return res.status(400).send(templateObject.error)
  }

  res.status(200).send(templateObject)
})

// POST /vm/create
// DESRIPTION: Creates a new VM, and returns the info

router.post('/vm/create', labAuth, async (req, res) => {

  try {
    const createdVmId = await createVm(req.session.lab_username, req.session.lab_token, req.body.templateId, req.body.vmName)

    if (createdVmId.error) {
      return res.status(400).send(createdVmId.error)
    }

    const vmObject = await getVmInfo(req.session.lab_username, req.session.lab_token, createdVmId);

    if (vmObject.error) {
      return res.status(400).send(vmObject.error)
    }

    return res.status(200).send(vmObject)
  } catch (error) {
    console.error(error)
    res.status(500).send(`Error! Check server logs`)
  }

})


// GET /vm/info/:vmid
// DESRIPTION: Returns VM info for the id passed in through param.
router.get('/vm/info/:vmid', [
  param('vmid', 'Please enter a VM ID').exists().isNumeric()
], labAuth, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const vmObject = await getVmInfo(req.session.lab_username, req.session.lab_token, req.params.vmid)

  if (vmObject.error) {
    return res.status(400).send(vmObject.error)
  }

  res.status(200).send(vmObject)
})

module.exports = router;