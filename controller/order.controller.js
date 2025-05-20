const orderModel = require("../models/order.models.js");
const cartModel = require("../models/cart.models.js");
const ProductModel = require("../models/product.models.js");
const userModel = require ('../models/user.models.js')
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils");

exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod } = req.body;

  const cartItems = await cartModel.find({ userId });

  if (cartItems.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  const products = [];
  let totalPrice = 0;

  for (const item of cartItems) {
    const product = await ProductModel.findById(item.productId);
    if (!product || !product.variants || product.variants.length === 0) {
      return next(new ApiError(404, "Product or variant not found"));
    }

    
    const variant = product.variants[0];

    const price = variant.discountPrice || variant.price;

    products.push({
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: price,
    });

    totalPrice += price * item.quantity;
  }

  const order = await orderModel.create({
    userId,
    products,
    shippingAddress,
    paymentMethod,
    totalPrice,
    paymentStatus: paymentMethod === "cash_on_delivery" ? "unpaid" : "paid",
  });

  await cartModel.deleteMany({ userId });

  res.status(201).json({ message: "Order placed successfully", order });

  for (let item of cartItems) {
    const product = await ProductModel.findById(item.productId);
    if (!product) return next(new ApiError(404, "Product not found"));

    if (item.quantity > product.variants[0].inStock) {
      return next(new ApiError(400, `Insufficient stock for ${product.variants[0].name.en}`));
    }

    product.variants[0].inStock -= item.quantity;
    await product.save();
  }
});


exports.getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await orderModel.find({ userId: req.user._id });
  const orderCount = orders.length;

  res.status(200).json({ orderCount, orders });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const order = await orderModel.findById(req.params.orderId)
  .populate('userId', 'userName email') 
  .populate('products.productId', 'variants.name variants.price variants.discountPrice variants.image');
  if (!order) return next(new ApiError(404, "Order not found"));
  res.status(200).json({ order });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, paymentStatus } = req.body;

  const order = await orderModel.findById(req.params.orderId);
  if (!order) return next(new ApiError(404, "Order not found"));

  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();

  res.status(200).json({ message: "Order updated", order });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await orderModel
    .find()
    .populate('userId', 'userName email') 
    .populate('products.productId', 'variants.name variants.price variants.discountPrice')

  res.status(200).json({ orders });
});

exports.getMonthlySales = catchAsync(async (req, res, next) => {
  const result = await orderModel.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id": 1 } }
  ]);
  res.status(200).json({ monthlySales: result });
});

exports.getOrderStatusStats = catchAsync(async (req, res, next) => {
  const result = await orderModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  res.status(200).json({ orderStatusStats: result });
});
