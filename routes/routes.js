const router = require('express').Router();

const db = require('./api/db')
const discord = require('./api/discord');

router.use('/api/discord', discord);
router.use('/api/db', db);

module.exports = router;
