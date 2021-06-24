const express = require('express');

const {
  createThread,
  saveForumUserId,
} = require('../../../controllers/forums/forums');

const router = express.Router();

router.route('/threads').post(createThread);
router.route('/forumUser').post(saveForumUserId);

module.exports = router;
