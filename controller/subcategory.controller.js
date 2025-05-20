const Subcategory = require("../models/subcategory.model.js");
const Category = require("../models/category.model.js"); 
const catchAsync = require("../utils/catchAsync.utils");
const QueryFeatures = require("../utils/queryFeatures.utils.js");

exports.createSubcategory = catchAsync(async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ message: 'categoryId is required' });
  }

  const subcategory = await Subcategory.create(req.body);

  await Category.findByIdAndUpdate(categoryId, {
    $addToSet: { subcategoriesId: subcategory._id },
  });

  res.status(201).json(subcategory);
});

exports.getAllSubcategories = catchAsync(async (req, res) => {
  const totalCount = await Subcategory.countDocuments();
  const features = new QueryFeatures(Subcategory.find(), req.query)
    .search()
    .filter()
    // .paginate();
  const subcategories = await features.query.populate("categoryId","name");

  res.status(200).json({
    message: "All subcategories",
    totalCount,
    results: subcategories.length,
    subcategories,
  });
});

exports.getSubcategoryById = catchAsync(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id).populate(
    "categoryId","name"
  );
  if (!subcategory)
    return res.status(404).json({ message: "Subcategory not found" });
  res.status(200).json(subcategory);
});

exports.updateSubcategory = catchAsync(async (req, res) => {
  const subcategory = await Subcategory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.status(200).json(subcategory);
});

exports.deleteSubcategory = catchAsync(async (req, res) => {
  await Subcategory.findByIdAndDelete(req.params.id);
  res.status(204).send();
});