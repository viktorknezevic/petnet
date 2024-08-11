const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: String,
  username: String, // Add this field
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  petDescription: String,
  petPhoto: String,
  userId: String,
  petName: String,
  profilePic: String,
  comments: [commentSchema],
  likes: { type: Number, default: 0 }
});

module.exports = mongoose.model('Post', postSchema);
