const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  discriminator: {
    type: String,
  },
  avatar: {
    type: String,
  },
  refresh_hash: {
    type: String,
  },
  forumUserId: {
    type: String,
  },
  openstackAppCredId: {
    type: String,
  },
  openstackAppCredSecret: {
    type: String,
  },
});

module.exports = User = mongoose.model('user', UserSchema);
