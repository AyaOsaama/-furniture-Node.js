const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  image: String,
  title: {
    en: String,
    ar: String,
  },
  description: {
    en: String,
    ar: String,
  },
  content: {
    en: String,
    ar: String,
  },
  author: String,

  likes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: String,

    },
  ],
  
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
