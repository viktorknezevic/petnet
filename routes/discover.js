const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

const trendingPosts = [
  {
    id: 1,
    petName: 'Max',
    profilePic: 'pet-profile-pic.jpg',
    photo: 'trending-photo.jpg',
    date: 'August 8, 2024',
    likes: 34,
    comments: 8
  },
];

router.get('/', requiresAuth(), (req, res) => {
  res.render('discover', {
    title: 'Discover - Pets4You',
    posts: trendingPosts
  });
});

module.exports = router;
