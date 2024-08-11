const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Group = require('../models/Group');
const { requiresAuth } = require('express-openid-connect');
const mongoose = require('mongoose');

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create a new group
router.post('/create', requiresAuth(), upload.single('profilePic'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const profilePic = req.file ? {
      data: req.file.buffer,
      contentType: req.file.mimetype
    } : undefined;

    const newGroup = new Group({
      name,
      description,
      profilePic,
      members: [req.oidc.user.sub]
    });

    await newGroup.save();
    res.redirect('/groups');
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).send('Server error');
  }
});

// Join a group
router.post('/:id/join', requiresAuth(), async (req, res) => {
  console.log('User ID:', req.oidc.user.sub);
  console.log('Group ID:', req.params.id);
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).send('Group not found');
    }

    if (group.members.includes(req.oidc.user.sub)) {
      return res.status(400).send('Already a member');
    }

    // Add the user to the group's members list
    group.members.push(req.oidc.user.sub);
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    console.error('Error joining group:', err);
    res.status(500).send('Server error');
  }
});

// Post a message to a group
router.post('/:id/message', requiresAuth(), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).send('Group not found');
    }

    const username = req.oidc.user.name; // or any field that contains the username
    group.messages.push({
      userId: req.oidc.user.sub,
      username: username,
      text: req.body.text,
      timestamp: new Date()
    });

    await group.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Render the group creation form
router.get('/create-group', requiresAuth(), (req, res) => {
  res.render('create-group');
});

// Middleware to validate ObjectId format
const validateObjectId = (req, res, next) => {
  const id = req.params.id;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return next();
  }
  res.status(400).send('Invalid ID format');
};

// Route for viewing a single group
router.get('/:id', requiresAuth(), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).exec();
    if (!group) {
      return res.status(404).send('Group not found');
    }
    res.render('group', { group }); // Use a different template like 'group'
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).send('Server error');
  }
});

// Route for listing all groups
router.get('/', requiresAuth(), async (req, res) => {
  try {
    const groups = await Group.find().exec();
    if (!groups) {
      console.error('No groups found');
      return res.status(404).send('No groups found');
    }
    res.render('groups', { groups });
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).send('Server error');
  }
});


module.exports = router;
