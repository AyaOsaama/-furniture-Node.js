
const Category = require("../models/category.model.js");
const catchAsync = require("../utils/catchAsync.utils");
const QueryFeatures = require("../utils/queryFeatures.utils.js");
const { uploadBufferToCloudinary } = require("../utils/cloudinary.utils");



exports.createCategory = catchAsync(async (req, res) => {
  console.log('====================================');
  console.log(Req.res);
  console.log('====================================');
  let imageUrl = '';

  if (req.file && req.file.buffer) {
    imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'categories');
  }

  let parsedName = { en: '', ar: '' };
  let parsedDescription = { en: '', ar: '' };
  let parsedSubcategoriesId = [];

  try {
    if (req.body.name) {
      parsedName = JSON.parse(req.body.name);
    }
    if (req.body.description) {
      parsedDescription = JSON.parse(req.body.description);
    }
    if (req.body.subcategoriesId) {
      parsedSubcategoriesId = JSON.parse(req.body.subcategoriesId);
    }
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON in name, description, or subcategoriesId' });
  }

  const category = await Category.create({
    image: imageUrl,
    name: parsedName,
    description: parsedDescription,
    subcategoriesId: parsedSubcategoriesId,
  });

  res.status(201).json(category);
});



exports.getAllCategories = catchAsync(async (req, res) => {
  const totalCount = await Category.countDocuments();
  const features = new QueryFeatures(Category.find().populate('subcategoriesId','name'), req.query)
    .search()
    .filter()
    // .paginate();
  const categories = await features.query;

  res.status(200).json({
    message: "All categories",
    totalCount,
    results: categories.length,
    categories,
  });
});


exports.getCategoryById = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "subcategoriesId","name"
  );
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.status(200).json(category);
});

exports.updateCategory = catchAsync(async (req, res) => {
  console.log('====================================');
  console.log(req.body);
  console.log('====================================');
  let parsedName = { en: '', ar: '' };
  let parsedDescription = { en: '', ar: '' };

  try {
    if (req.body.name) {
      parsedName = JSON.parse(req.body.name);
    }
    if (req.body.description) {
      parsedDescription = JSON.parse(req.body.description);
    }
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON in name or description' });
  }

  let updatedData = {
    ...req.body,
    name: parsedName,
    description: parsedDescription,
  };

  if (req.file && req.file.buffer) {
    const imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'categories');
    updatedData.image = imageUrl;
  }

  if (updatedData.subcategoriesId && typeof updatedData.subcategoriesId === 'string') {
    try {
      updatedData.subcategoriesId = JSON.parse(updatedData.subcategoriesId);
    } catch {
      updatedData.subcategoriesId = [];
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updatedData, {
    new: true,
  });

  res.status(200).json(updatedCategory);
});



exports.deleteCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
