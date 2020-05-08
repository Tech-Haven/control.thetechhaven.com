const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LabUserSchema = new Schema({
  userID: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  login_token: {
    type: String,
    required: true
  },
  discord_user: {
    type: String,
    ref: 'user'
  }
});

module.exports = User = mongoose.model('labUser', LabUserSchema);