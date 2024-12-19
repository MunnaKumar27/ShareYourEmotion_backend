const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: { type: Date, default: Date.now },
  tags: [String], // Tags field, which will be an array of strings
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
