const router = require('express').Router();

const discord = require('./api/discord');

router.use('/api/discord', discord);

module.exports = router;
