const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils");

const userModel = require("../models/user.models.js");
const ProductModel = require("../models/product.models.js");

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) return next(new ApiError(400, "Product ID is required"));

  const product = await ProductModel.findById(productId);
  if (!product) return next(new ApiError(404, "Product not found"));

  const user = await userModel.findById(req.user._id);

  const alreadyExists = user.wishlist.includes(productId);
  if (alreadyExists) {
    return res.status(400).json({ message: "Product already in wishlist" });
  }

  user.wishlist.push(productId);
  await user.save();

  res
    .status(200)
    .json({ message: "Product added to wishlist", wishlist: user.wishlist });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const user = await userModel.findById(req.user._id);

  const inList = user.wishlist.includes(productId);
  if (inList) {
    return next(new ApiError(404, "Product not found in wishlist"));
  }

  user.wishlist = user.wishlist.filter((item) => item.toString() !== productId);
  await user.save();

  res.status(200).json({
    message: "Product removed from wishlist",
    wishlist: user.wishlist,
  });
});

exports.getWishlist = catchAsync(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).populate("wishlist");

  if (!user) return next(new ApiError(404, "User not found"));

  res.status(200).json({ wishlist: user.wishlist });
});

exports.toggleWishlist = catchAsync(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  const { productId } = req.body;

  if (!productId) return next(new ApiError(400, "Product ID is required"));

  const product = await ProductModel.findById(productId);
  if (!product) return next(new ApiError(404, "Product not found"));

  const index = user.wishlist.findIndex((id) => id.toString() === productId);

  if (index > -1) {
    user.wishlist.splice(index, 1);
    await user.save();
    return res.status(200).json({
      message: "Removed from wishlist",
      wishlist: user.wishlist,
      inWishlist: false,
    });
  } else {
    user.wishlist.push(productId);
    await user.save();
    return res.status(200).json({
      message: "Added to wishlist",
      wishlist: user.wishlist,
      inWishlist: true,
    });
  }
});
