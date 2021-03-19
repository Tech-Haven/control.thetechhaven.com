const router = require('express').Router();

const db = require('./api/db');
const discord = require('./api/discord');

const openstackv1 = require('./api/v1/openstack');

router.use('/api/discord', discord);
router.use('/api/db', db);

router.use('/api/v1/openstack', openstackv1);

module.exports = router;
