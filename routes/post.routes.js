const express = require("express");
const router = express.Router();
const {auth} = require("../Middleware/auth.middleware.js");

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  commentPost,
  deleteComment,
  deleteAllPosts
} = require("../controller/post.controller.js");
const upload = require("../utils/multer.utils.js");
router.post("/", upload.single("image"), createPost);
router.get("/", getAllPosts);
router.delete("/", deleteAllPosts);
router.get("/:id", getPostById);
router.put("/:id", upload.single("image"),updatePost);
router.delete("/:id", deletePost);
router.put("/like/:id", auth, likePost);
router.post("/comment/:id", auth, commentPost);
router.delete("/comment/:id", deleteComment);

module.exports = router;
