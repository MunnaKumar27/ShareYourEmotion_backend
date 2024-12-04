const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// Enable CORS for frontend domains
app.use(cors({
  credentials: true,  // Allow cookies to be sent
  origin: ['https://share-your-emotions.vercel.app', 'http://localhost:3000'], // Allow specific origins
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://Munna:Munna123@cluster0.vpelu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // Logged in successfully
    jwt.sign({ username, id: userDoc._id }, secret, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, {
        httpOnly: true,  // Prevent access to cookie from JS
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        sameSite: 'Strict', // Prevent CSRF attacks
      }).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

// Profile endpoint
app.get('/profile', (req, res) => {
  const { token } = req.cookies;  // Extract token from cookies
  if (!token) {
    return res.status(401).json({ error: 'JWT must be provided' });
  }
  
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    res.json(info);  // Send the decoded information from the JWT
  });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) }).json('ok');
});

// Create a post endpoint
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});

// Update a post endpoint
app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  // JWT verification and post update
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { id, title, summary, content } = req.body;

    // Find the post by ID
    const postDoc = await Post.findById(id);
    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user is the author
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json({ error: 'You are not the author of this post' });
    }

    // Update the post with new data
    const updatedPost = await Post.findByIdAndUpdate(id, {
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,  // Update cover if new file uploaded
    }, { new: true });  // `new: true` ensures the updated document is returned

    res.json(updatedPost);
  });
});

// Fetch all posts endpoint
app.get('/post', async (req, res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

// Fetch a specific post by ID
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
});

console.log("Connected successfully and ready to handle requests");

app.listen(4000);
