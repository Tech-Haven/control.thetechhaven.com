const router = require('express').Router();

const db = require('./api/db');
const discord = require('./api/discord');

const openstackv1 = require('./api/v1/openstack');
const downloadv1 = require('./api/v1/download');
const forumsv1 = require('./api/v1/forums');

router.use('/api/discord', discord);
router.use('/api/db', db);

router.use('/api/v1/openstack', openstackv1);
router.use('/api/v1/download', downloadv1);
router.use('/api/v1/forums', forumsv1);

module.exports = router;
