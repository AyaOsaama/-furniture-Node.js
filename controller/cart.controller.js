const cartModel = require("../models/cart.models.js");
const ProductModel = require("../models/product.models.js");
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils");

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity, priceAtAddition } = req.body;
  const userId = req.user._id;

  const product = await ProductModel.findById(productId);
  if (!product) return next(new ApiError(404, "Product not found"));

  if (quantity > product.inStock) {
    return next(new ApiError(400, "Not enough stock available"));
  }

  let existingItem = await cartModel.findOne({ userId, productId });

  if (existingItem) {
    existingItem.quantity += quantity;
    await existingItem.save();
    return res
      .status(200)
      .json({ message: "Cart item updated", item: existingItem });
  }

  const cartItem = await cartModel.create({
    productId,
    quantity,
    userId,
    priceAtAddition,
  });

  res.status(201).json({ message: "Item added to cart", item: cartItem });
});

exports.getCartByUser = catchAsync(async (req, res, next) => {
  const cart = await cartModel
    .find({ userId: req.user._id })
    .populate("productId");
  res.status(200).json({ cart });
});

exports.updateCartProduct = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const cartProduct = await cartModel.findByIdAndUpdate(
    req.params.cartProductId,
    { quantity },
    { new: true, runValidators: true }
  );

  if (!cartProduct) return next(new ApiError(404, "Cart item not found"));

  res.status(200).json({ message: "Cart item updated", cartProduct });
});

exports.deleteCartProduct = catchAsync(async (req, res, next) => {
  const deleted = await cartModel.findByIdAndDelete(req.params.cartProductId);
  if (!deleted) return next(new ApiError(404, "Cart item not found"));
  res.status(200).json({ message: "Cart item removed" });
});

exports.clearCart = catchAsync(async (req, res, next) => {
  await cartModel.deleteMany({ userId: req.user._id });
  res.status(200).json({ message: "Cart cleared" });
});

// GET /api/cart/users-with-items
exports.getUsersWithCartItems = catchAsync(async (req, res, next) => {
  const userCount = await cartModel.distinct("userId");
  res.status(200).json({ userCount: userCount.length });
});


// GET /api/cart/top-products
exports.getTopProductsInCart = catchAsync(async (req, res, next) => {
  const topProducts = await cartModel.aggregate([
    {
      $group: {
        _id: "$productId",
        totalQuantity: { $sum: "$quantity" }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    { $limit: 5 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        totalQuantity: 1,
        name: { $arrayElemAt: ["$product.variants.name.en", 0] }, // ✅ الاسم من أول variant
        image: { $arrayElemAt: ["$product.variants.image", 0] }   // ✅ الصورة من أول variant
      }
    }
  ]);

  res.status(200).json({ topProducts });
});

// GET /api/cart/total-value
exports.getTotalCartValue = catchAsync(async (req, res, next) => {
  const totalValue = await cartModel.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ["$priceAtAddition", "$quantity"] } }
      }
    }
  ]);
  res.status(200).json({ totalValue: totalValue[0]?.totalValue || 0 });
});
// GET /api/cart/total-items
exports.getTotalCartItems = catchAsync(async (req, res, next) => {
  const totalItems = await cartModel.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$quantity" }
      }
    }
  ]);
  res.status(200).json({ totalItems: totalItems[0]?.total || 0 });
});
// GET /api/cart/total-items
exports.getTotalCartItems = catchAsync(async (req, res, next) => {
  const totalItems = await cartModel.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$quantity" }
      }
    }
  ]);
  res.status(200).json({ totalItems: totalItems[0]?.total || 0 });
});
