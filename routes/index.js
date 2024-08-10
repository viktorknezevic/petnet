// routes/index.js

const express = require('express');
const router = express.Router();
const upload = require('../upload'); // Import the upload middleware

// Display the form to post a new pet
router.get('/post-pet', (req, res) => {
  res.render('post-pet');
});

// Handle form submission to post a new pet
router.post('/post-pet', upload.single('petPhoto'), (req, res) => {
  // Example data; replace with actual data from your database
  const newPost = {
    profilePic: req.body.profilePic, // Assuming profilePic is from the form
    petName: req.body.petName,
    date: new Date().toLocaleDateString(),
    photo: req.file.path, // Uploaded pet photo
    likes: 0,
    comments: 0
  };

  // Save `newPost` to your database here

  res.redirect('/discover'); // Redirect to discover page or wherever appropriate
});

module.exports = router;
