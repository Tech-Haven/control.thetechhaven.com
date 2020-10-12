const router = require('express').Router();

const db = require('./api/db');
const discord = require('./api/discord');
const lab = require('./api/lab');

const labv1 = require('./api/v1/lab');

router.use('/api/discord', discord);
router.use('/api/db', db);
router.use('/api/lab', lab);

router.use('/api/v1/lab', labv1);

module.exports = router;
