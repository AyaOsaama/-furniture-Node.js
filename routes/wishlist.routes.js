const express = require("express");
const router = express.Router();
const { auth } = require("../Middleware/auth.middleware.js");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controller/wishlist.controller.js");

router.use(auth);

router.route("/").get(getWishlist).post(addToWishlist);
router.post("/toggle", toggleWishlist);
router.delete("/:productId", removeFromWishlist);
module.exports = router;
