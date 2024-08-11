const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const { auth, requiresAuth } = require('express-openid-connect');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
const Post = require('./models/Post'); // Import the Post model
const fs = require('fs');

dotenv.config();

// Connect to MongoDB
mongoose.connect("mongodb+srv://viki:vikica@cluster0.sroq9xw.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const app = express();

// Multer setup for file uploads
const storage = multer.memoryStorage(); // Use memoryStorage to keep file in memory

const upload = multer({ 
  storage: storage
});

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,  // Ensure this is set in your .env file
  baseURL: `http://192.168.1.100:${process.env.PORT || 3000}`,
  clientID: process.env.CLIENT_ID,  // Ensure this is set in your .env file
  issuerBaseURL: process.env.ISSUER_BASE_URL,  // Ensure this is set in your .env file
};

// Use Auth0 middleware
app.use(auth(config));

// Serve static HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Profile route with authentication
// server.js
app.get('/profile', requiresAuth(), async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.oidc.user.sub }).populate('followers');
    const petPosts = user ? await Post.find({ userId: req.oidc.user.sub }) : [];

    res.render('profile', {
      user: req.oidc.user,
      followerCount: user ? user.followers.length : 0, // Count followers
      pet: user ? {
        petName: user.petName || '',
        petType: user.petType || '',
        petPhoto: user.petPhoto || '',
        petBio: user.petBio || '',
      } : {},
      petPosts
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Handle profile updates with file upload
app.post('/profile', requiresAuth(), upload.single('petPhoto'), async (req, res) => {
  try {
    const { petName, petType, petBio } = req.body;
    const petPhoto = req.file ? {
      data: req.file.buffer,
      contentType: req.file.mimetype
    } : undefined;

    let user = await User.findOne({ auth0Id: req.oidc.user.sub });

    if (!user) {
      user = new User({
        auth0Id: req.oidc.user.sub,
        petName: petName || '',
        petType: petType || '',
        petPhoto: petPhoto || {},
        petBio: petBio || '',
      });
    } else {
      user.petName = petName || user.petName;
      user.petType = petType || user.petType;
      user.petPhoto = petPhoto || user.petPhoto;
      user.petBio = petBio || user.petBio;
    }

    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Update Pet Information Route
app.post('/update-pet', requiresAuth(), upload.single('petPhoto'), async (req, res) => {
  try {
    const { petName, petType, petBio } = req.body;
    const petPhoto = req.file ? {
      data: req.file.buffer,
      contentType: req.file.mimetype
    } : undefined;

    const user = await User.findOne({ auth0Id: req.oidc.user.sub });

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.petName = petName || user.petName;
    user.petType = petType || user.petType;
    user.petPhoto = petPhoto || user.petPhoto;
    user.petBio = petBio || user.petBio;

    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Handle pet post creation
app.get('/post-pet', requiresAuth(), (req, res) => {
  res.render('post-pet'); // Render the form for creating a new post
});

app.post('/create-post', requiresAuth(), upload.single('petPhoto'), async (req, res) => {
  try {
    const { petDescription, petName } = req.body;
    let petPhotoPath;

    if (req.file) {
      const uploadPath = path.join(__dirname, 'uploads', req.file.originalname);
      fs.writeFileSync(uploadPath, req.file.buffer);
      petPhotoPath = `/uploads/${req.file.originalname}`;
    }

    const user = await User.findOne({ auth0Id: req.oidc.user.sub });

    if (!user) {
      return res.status(400).send('User not found');
    }

    const newPost = new Post({
      petDescription,
      petPhoto: petPhotoPath,
      userId: req.oidc.user.sub,
      petName: user.petName, // Use petName from the user document
      profilePic: user.petPhoto // Use profilePic from the user document
    });

    await newPost.save();
    res.redirect('/discover');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Server error');
  }
});

// Discover route for rendering posts
app.get('/discover', requiresAuth(), async (req, res) => {
  try {
    const posts = await Post.find().populate('userId'); // Ensure you have a reference to the user
    res.render('discover', { posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Additional Routes
const indexRouter = require('./routes/index');
const discoverRouter = require('./routes/discover');
const messagesRouter = require('./routes/messages');
const postRoutes = require('./routes/posts'); // Assuming routes/posts.js
const groupRouter = require('./routes/groups');

app.use('/', indexRouter);
app.use('/groups', groupRouter);
app.use('/discover', discoverRouter);
app.use('/messages', messagesRouter);
app.use('/posts', postRoutes); // Ensure postRoutes does not interfere with /create-post

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {}
  });
});

app.post('/posts/:id/comment', requiresAuth(), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = await User.findOne({ auth0Id: req.oidc.user.sub });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    post.comments.push({ userId: req.oidc.user.sub, text: req.body.text, username: user.username });
    await post.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/posts/:id/like', requiresAuth(), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    post.likes += 1;
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create and start server
http.createServer(app).listen(process.env.PORT || 3000, '192.168.1.100', () => {
  console.log(`Listening on http://192.168.1.100:${process.env.PORT || 3000}`);
});