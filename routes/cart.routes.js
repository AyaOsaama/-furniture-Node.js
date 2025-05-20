let express = require("express");
let router = express.Router();
const { auth } = require("../Middleware/auth.middleware.js");

let {
  addToCart,
  getCartByUser,
  updateCartProduct,
  deleteCartProduct,
  clearCart,
  getUsersWithCartItems,
  getTopProductsInCart,
  getTotalCartValue,
  getTotalCartItems
} = require("../controller/cart.controller.js");

//Protect
router.use(auth);

//EndPoints
router.post("/", addToCart);
router.get("/", getCartByUser);
//Analytics  Endpoints
router.get('/total-items', getTotalCartItems);
router.get('/total-value', getTotalCartValue);
router.get('/top-products', getTopProductsInCart);
router.get('/users-with-items', getUsersWithCartItems);
//----------------
router.patch("/:cartProductId", updateCartProduct);
router.delete("/:cartProductId", deleteCartProduct);
router.delete("/clear", clearCart);


module.exports = router;
