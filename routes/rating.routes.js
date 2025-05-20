const express = require("express");
const router = express.Router();
const {
  createRating,
  getAllRatings,
  getRatingById,
  deleteRating,
  getRatingsWithComments,
  getMostRatedProducts,
  getRatingDistribution,
  getAverageRating,
  getTotalRatings
} = require("../controller/rating.controller.js");

router.post("/", createRating);
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



module.exports = router;
