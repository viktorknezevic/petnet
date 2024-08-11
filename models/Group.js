const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: String,
  username: String, // Add username field
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const groupSchema = new mongoose.Schema({
  name: String,
  description: String,
  profilePic: { data: Buffer, contentType: String },
  messages: [messageSchema]
});

module.exports = mongoose.model('Group', groupSchema);
