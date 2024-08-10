// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  petDescription: {
    type: String,
    required: true
  },
  petPhoto: {
    type: String // Store the path to the image file
  },
  userId: {
    type: String,
    required: true
  },
  petName: {
    type: String
  },
  profilePic: {
    type: String
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    userId: { type: String },
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Post', postSchema);
