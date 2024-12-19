const Post = require("../models/Post");
const multer = require("multer");

// Set up multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});
const upload = multer({ storage: storage }).single("image");

// Create a new post
exports.createPost = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: "File upload failed" });
        }
        const { title, content } = req.body;
        const image = req.file ? req.file.filename : null;

        const post = new Post({ title, content, image });
        await post.save();
        res.status(201).json(post);
    });
};

// Get all posts
exports.getPosts = async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
};

// Get single post
exports.getPost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.json(post);
};

// Update a post
exports.updatePost = async (req, res) => {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.id);
    if (post) {
        post.title = title;
        post.content = content;
        await post.save();
        res.json(post);
    } else {
        res.status(404).json({ message: "Post not found" });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        await post.remove();
        res.json({ message: "Post deleted" });
    } else {
        res.status(404).json({ message: "Post not found" });
    }
};
