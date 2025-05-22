const express = require("express");
const router = express.Router();
const {auth} = require('../Middleware/auth.middleware.js')
const {
  createRating,
  getAllRatings,
  getRatingById,
  deleteRating,
  getRatingsWithComments,
  getMostRatedProducts,
  getRatingDistribution,
  getAverageRating,
  getTotalRatings,
  deleteCommentFromRating
} = require("../controller/rating.controller.js");

router.post("/",auth, createRating);
router.get("/", getAllRatings);

// Analytics Enpoints
router.get("/total", getTotalRatings);
router.get("/average", getAverageRating);
router.get("/distribution", getRatingDistribution);
router.get("/most-rated-products", getMostRatedProducts);
router.get("/with-comments", getRatingsWithComments);
// ------------------------------------------------------
router.get("/:id", getRatingById);
router.delete("/:id", deleteRating);
router.patch("/:id/remove-comment",auth, deleteCommentFromRating);



module.exports = router;
