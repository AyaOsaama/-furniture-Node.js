const Rating = require("../models/rating.model.js");
const catchAsync = require("../utils/catchAsync.utils");
const QueryFeatures = require("../utils/queryFeatures.utils.js");
const Product = require('../models/product.models.js'); 

exports.createRating = catchAsync(async (req, res) => {
  const newRating = await Rating.create(req.body);

  const ratings = await Rating.find({ productId: newRating.productId });

  const ratingCount = ratings.length;

  const averageRating =
    ratings.reduce((acc, r) => acc + r.value, 0) / ratingCount;

  await Product.findByIdAndUpdate(newRating.productId, {
    averageRating,
    ratingCount,
  });

  res.status(201).json({
    message: 'Rating created and product updated',
    rating: newRating,
  });
});


exports.getAllRatings = catchAsync(async (req, res) => {
  const totalCount = await Rating.countDocuments();

  const features = new QueryFeatures(
    Rating.find().populate('userId', 'name email') 
                .populate('productId', 'variants description brand'), 
    req.query
  )
    .search()
    .filter();
    // .paginate();

  const ratings = await features.query;

  res.status(200).json({
    message: "All ratings",
    totalCount,
    results: ratings.length,
    ratings,
  });
});

exports.getRatingById = catchAsync(async (req, res) => {
  const rating = await Rating.findById(req.params.id)
    .populate('userId', 'name email') 
    .populate('productId', 'variants description brand');

  if (!rating)
    return res.status(404).json({ message: "Rating not found" });

  res.status(200).json(rating);
});


exports.deleteRating = catchAsync(async (req, res) => {
  await Rating.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
// Analytics 


// 1. عدد التقييمات الكلي
exports.getTotalRatings = catchAsync(async (req, res) => {
  const count = await Rating.countDocuments();
  res.status(200).json({ totalRatings: count });
});

// 2. متوسط التقييم العام
exports.getAverageRating = catchAsync(async (req, res) => {
  const result = await Rating.aggregate([
    { $group: { _id: null, avgRating: { $avg: "$value" } } }
  ]);
  res.status(200).json({ averageRating: result[0]?.avgRating.toFixed(2) || 0 });
});

// 3. عدد التقييمات حسب كل قيمة (1 إلى 5)
exports.getRatingDistribution = catchAsync(async (req, res) => {
  const result = await Rating.aggregate([
    {
      $group: {
        _id: "$value",
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.status(200).json({ ratingDistribution: result });
});

// 4. المنتجات الأكثر تقييمًا
exports.getMostRatedProducts = catchAsync(async (req, res) => {
  const result = await Rating.aggregate([
    {
      $group: {
        _id: "$productId",
        count: { $sum: 1 },
        avg: { $avg: "$value" }
      }
    },
    { $sort: { count: -1 } },
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
        productId: "$_id",
        count: 1,
        avg: { $round: ["$avg", 1] },
        name: "$product.variants.name",
        image: "$product.variants.image"
      }
    }
  ]);
  res.status(200).json({ topRatedProducts: result });
});

// 5. عدد التقييمات التي تحتوي على تعليق مكتوب
exports.getRatingsWithComments = catchAsync(async (req, res) => {
  const count = await Rating.countDocuments({
    $or: [
      { "comment.en": { $exists: true, $ne: "" } },
      { "comment.ar": { $exists: true, $ne: "" } }
    ]
  });
  res.status(200).json({ ratingsWithComments: count });
});


