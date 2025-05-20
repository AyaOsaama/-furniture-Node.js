let express = require("express");
let router = express.Router();
let { auth, restrictTo } = require("../Middleware/auth.middleware");
let {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  getMonthlySales,
  getOrderStatusStats
} = require("../controller/order.controller.js");

//Protect
// router.use(auth);

//EndPoints
router.get("/all",auth , restrictTo("super_admin","admin"),getAllOrders);
router.post("/", auth, createOrder);
router.get("/", auth, getUserOrders);
//Analytics 
router.get("/monthly-sales", auth, restrictTo("admin", "super_admin"), getMonthlySales);
router.get("/status-stats", auth, restrictTo("admin", "super_admin"), getOrderStatusStats);
// -----------
router.get("/:orderId", auth, getOrderById);
router.patch("/:orderId",auth, restrictTo("super_admin", "admin"),updateOrderStatus);
module.exports = router;

