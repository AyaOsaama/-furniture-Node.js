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

// 🛡️ Protect all routes
router.use(auth);

// 🛒 Basic Cart Operations
router.post("/", addToCart);                           
router.get("/", getCartByUser);   
router.delete("/clear", clearCart);                   
// 📊 Cart Analytics
router.get("/total-items", getTotalCartItems);        
router.get("/total-value", getTotalCartValue);        
router.get("/top-products", getTopProductsInCart);    
router.get("/users-with-items", getUsersWithCartItems); 

router.patch("/:cartProductId", updateCartProduct);    
router.delete("/:cartProductId", deleteCartProduct);  

 

module.exports = router;
