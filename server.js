const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer'); // Add multer for file uploads
const Post = require('./models/Post'); // Assuming you have a Post model defined

const app = express();
const port = 5000;

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store uploaded files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Use current timestamp as a unique filename
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images statically

// Connect to MongoDB
mongoose.connect('mongodb+srv://Munna:Munna123@cluster0.vpelu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Define routes

app.get('/api/posts/tag/:tag', async (req, res) => {
    const tag = req.params.tag;
  
    try {
      const posts = await Post.find({ tags: tag }); // Filter posts by tag
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

// GET /api/posts - Fetch all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 }); // Fetch posts, sorted by date (most recent first)
    res.status(200).json(posts); // Send the posts back as JSON
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// POST /api/posts - Create a new post
app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
      const { title, content, tags } = req.body;
      const tagsArray = JSON.parse(tags); // Parse the JSON string of tags
  
      const newPost = new Post({
        title,
        content,
        image: req.file ? req.file.path : null, // If there's an image, save it, otherwise set to null
        tags: tagsArray,
      });
  
      await newPost.save();
      res.status(201).json(newPost); // Return the created post
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  });


// Route to delete a post by ID
app.delete('/api/posts/:id', async (req, res) => {
    try {
      const deletedPost = await Post.findByIdAndDelete(req.params.id);
      if (!deletedPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  });
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
