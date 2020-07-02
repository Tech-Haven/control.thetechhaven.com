const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  channelID: {
    type: String,
    required: true
  }
});

module.exports = TicketMessage = mongoose.model('ticketmessage', TicketSchema);
