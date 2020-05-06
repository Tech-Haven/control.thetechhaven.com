const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  refresh_hash: {
    type: String,
    required: true
  },
  lab_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'labUser'
  }
});

module.exports = User = mongoose.model('user', UserSchema);
