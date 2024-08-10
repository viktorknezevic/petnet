const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

router.get('/', requiresAuth(), (req, res) => {
  res.render('messages', {
    title: 'Messages - Pets4You'
  });
});

module.exports = router;
