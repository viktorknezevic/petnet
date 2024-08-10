// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true
  },
  petName: String,
  petType: String,
  petPhoto: {
    data: Buffer,
    contentType: String
  },
  petBio: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('User', userSchema);
