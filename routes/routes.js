const router = require('express').Router();

const db = require('./api/db');
const discord = require('./api/discord');

const openstackv1 = require('./api/v1/openstack');
const vaultv1 = require('./api/v1/vault');

router.use('/api/discord', discord);
router.use('/api/db', db);

router.use('/api/v1/openstack', openstackv1);
router.use('/api/v1/vault', vaultv1);

module.exports = router;
