const router = require('express').Router();

const db = require('./api/db')
const discord = require('./api/discord');
const lab = require('./api/lab')

router.use('/api/discord', discord);
router.use('/api/db', db);
router.use('/api/lab', lab)

module.exports = router;
