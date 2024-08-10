const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const { requiresAuth } = require('express-openid-connect');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Handle pet post creation
router.post('/create-post', requiresAuth(), upload.single('petPhoto'), async (req, res) => {
  console.log('Received POST request to /create-post');
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);

  try {
    const { petDescription } = req.body;
    const petPhotoPath = req.file ? req.file.path : undefined;

    const newPost = new Post({
      petDescription,
      petPhoto: petPhotoPath,
      userId: req.oidc.user.sub
    });

    await newPost.save();
    res.redirect('/discover');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Server error');
  }
});

// Like a post
router.post('/:id/like', requiresAuth(), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.likes += 1; // Increment likes count
    await post.save();

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Comment on a post
router.post('/:id/comment', requiresAuth(), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      userId: req.oidc.user.sub,
      text: req.body.text
    });

    await post.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
