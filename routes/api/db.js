const express = require('express');
const auth = require('../../middleware/auth');
const staff = require('../../middleware/staff');
const User = require('../../models/User');

const router = express.Router();

// @route   GET api/db/users
// @desc    List users in the local database (users that have logged in before)
// @access  Staff Only
router.get('/users', auth, staff, async (req, res) => {
  try {
    const allUsers = await User.find({}, { refresh_hash: 0 });

    if (!allUsers) {
      return res.status(200).json('No users found');
    }

    res.status(200).json(allUsers);
  } catch (err) {
    res.status(500).json('Server error');
    console.error(err);
  }
});

module.exports = router;
