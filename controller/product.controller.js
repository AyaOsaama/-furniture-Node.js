const ProductModel = require("../models/product.models.js");
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils.js");
const QueryFeatures = require("../utils/queryFeatures.utils.js");
const { uploadBufferToCloudinary } = require("../utils/cloudinary.utils.js");
// controllers/productController.js

const Subcategory = require("../models/subcategory.model.js");

exports.createProduct = catchAsync(async (req, res, next) => {
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  const { brand, categories, description, material, variants } = req.body;

  const parsedCategories = categories ? JSON.parse(categories) : { main: '', sub: '' };
  const parsedDescription = description ? JSON.parse(description) : { en: '', ar: '' };
  const parsedMaterial = material ? JSON.parse(material) : { en: '', ar: '' };
  const parsedVariants = variants ? JSON.parse(variants) : [];

  if (!Array.isArray(parsedVariants)) {
    return next(new ApiError('Variants must be an array', 400));
  }

  const mainVariantImage = req.files?.variantImage?.[0]
  ? await uploadBufferToCloudinary(req.files.variantImage[0].buffer)
  : null;

const additionalVariantImages = req.files?.variantImages?.length > 0
  ? await Promise.all(req.files.variantImages.map(file => uploadBufferToCloudinary(file.buffer)))
  : [];

if (parsedVariants.length > 0) {
  parsedVariants[0].image = mainVariantImage;
  parsedVariants[0].images = additionalVariantImages;
}


   const newProductModel= new ProductModel({
    brand,
    categories: parsedCategories,
    description: parsedDescription,
    material: parsedMaterial,
   variants: parsedVariants
    })
    const newProduct = await newProductModel.save();
  res.status(201).json({
    message: "Product created successfully",
    product: newProduct
  });

});


exports.getAllProducts = catchAsync(async (req, res, next) => {
  const totalCount = await ProductModel.countDocuments();
  const features = new QueryFeatures(ProductModel.find(), req.query)
    .search()
    .filter()
    // .paginate();
  const products = await features.query.populate(
    "categories.main categories.sub",
    "-name"
  );

  res.status(200).json({
    message: "All products",
    totalCount,
    results: products.length,
    products,
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id).populate(
    "categories.main categories.sub",
    "-name"
  );
  if (!product) return next(new ApiError(404, "Product not found"));
  res.status(200).json({ message: "success", product });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!product) return next(new ApiError(404, "Product not found"));
  res.status(200).json({ message: "Product updated", product });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findByIdAndDelete(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));
  res.status(200).json({ message: "Product deleted" });
});

exports.addVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  // Parse values from req.body
  const {
    price,
    discountPrice,
    material,
    description,
    ...rest
  } = req.body;

  const parsedMaterial = material ? JSON.parse(material) : { en: '', ar: '' };
  const parsedDescription = description ? JSON.parse(description) : { en: '', ar: '' };

  if (discountPrice && discountPrice >= price) {
    return next(new ApiError(400, "Discount price must be less than the actual price"));
  }

  let image = null;
  if (req.files?.image?.[0]) {
    image = await uploadBufferToCloudinary(req.files.image[0].buffer);
  }

  let images = [];
  if (req.files?.images?.length > 0) {
    images = await Promise.all(
      req.files.images.map(file => uploadBufferToCloudinary(file.buffer))
    );
  }

  product.variants.push({
    ...rest,
    price,
    discountPrice,
    material: parsedMaterial,
    description: parsedDescription,
    image,
    images,
  });

  await product.save();
  res.status(200).json({ message: "Variant added", product });
});



exports.deleteVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  const variantId = req.params.variantId;
  const variant = product.variants.id(variantId);
  if (!variant) return next(new ApiError(404, "Variant not found"));

  variant.remove();
  await product.save();

  res.status(200).json({ message: "Variant deleted", product });
});

exports.updateVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  const variant = product.variants.id(req.params.variantId);
  if (!variant) return next(new ApiError(404, "Variant not found"));

  const {
    price,
    discountPrice,
    material,
    description,
    ...rest
  } = req.body;

  const parsedMaterial = material ? JSON.parse(material) : variant.material;
  const parsedDescription = description ? JSON.parse(description) : variant.description;

  const updated = {
    ...variant.toObject(),
    ...rest,
    price,
    discountPrice,
    material: parsedMaterial,
    description: parsedDescription,
  };

  if (updated.discountPrice && updated.discountPrice >= updated.price) {
    return next(new ApiError(400, "Discount price must be less than the actual price"));
  }

  if (req.files?.image?.[0]) {
    updated.image = await uploadBufferToCloudinary(req.files.image[0].buffer);
  }

  if (req.files?.images?.length > 0) {
    updated.images = await Promise.all(
      req.files.images.map(file => uploadBufferToCloudinary(file.buffer))
    );
  }

  Object.assign(variant, updated);
  await product.save();

  res.status(200).json({ message: "Variant updated", product });
});


exports.getTotalProducts = catchAsync(async (req, res) => {
  const count = await ProductModel.countDocuments();
  res.status(200).json({ totalProducts: count });
});


exports.getTotalVariants = catchAsync(async (req, res) => {
  const result = await ProductModel.aggregate([
    { $project: { variantCount: { $size: "$variants" } } },
    { $group: { _id: null, totalVariants: { $sum: "$variantCount" } } }
  ]);
  res.status(200).json({ totalVariants: result[0]?.totalVariants || 0 });
});

exports.getBrandsCount = catchAsync(async (req, res) => {
  const result = await ProductModel.aggregate([
    {
      $group: {
        _id: "$brand"
      }
    },
    {
      $count: "brandsCount"
    }
  ]);
  const brandsCount = result[0]?.brandsCount || 0;
  res.status(200).json({ brandsCount });
});

exports.getTopRatedProducts = catchAsync(async (req, res) => {
  const result = await ProductModel.aggregate([
    { $unwind: "$variants" },
    { $sort: { "variants.averageRating": -1 } },
    { $limit: 5 },
    {
      $project: {
        name: "$variants.name",
        averageRating: "$variants.averageRating",
        ratingCount: "$variants.ratingCount",
        image: "$variants.image"
      }
    }
  ]);
  res.status(200).json({ topRated: result });
});

exports.getDiscountedVariantsCount = catchAsync(async (req, res) => {
  const result = await ProductModel.aggregate([
    { $unwind: "$variants" },
    { $match: { "variants.discountPrice": { $gt: 0 } } },
    { $count: "discountedVariants" }
  ]);
  res.status(200).json({ discountedVariants: result[0]?.discountedVariants || 0 });
});

exports.getLowStockVariants = catchAsync(async (req, res) => {
  const result = await ProductModel.aggregate([
    { $unwind: "$variants" },
    { $match: { "variants.inStock": { $lte: 5 } } },
    { $count: "lowStockVariants" }
  ]);
  res.status(200).json({ lowStockVariants: result[0]?.lowStockVariants || 0 });
});




exports.getRelatedProductsByTags = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Get the current product
    const currentProduct = await ProductModel.findById(productId);
    if (!currentProduct) return res.status(404).json({ message: "Product not found" });

    // 2. Get the subcategory and its tags
    const subcategory = await Subcategory.findById(currentProduct.categories.sub);
    if (!subcategory || !subcategory.tags || subcategory.tags.length === 0) {
      return res.json([]); // No tags, return empty list
    }

    // 3. Get products whose subcategory has at least one common tag
    const relatedSubcategories = await Subcategory.find({
      tags: { $in: subcategory.tags }
    });

    const relatedSubcategoryIds = relatedSubcategories.map(sc => sc._id);

    // 4. Get related products that are not the current product
    const relatedProducts = await ProductModel.find({
      _id: { $ne: currentProduct._id },
      "categories.sub": { $in: relatedSubcategoryIds }
    });

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductsByTag = async (req, res) => {
  const { tag } = req.params;

  try {
    const subcategories = await Subcategory.find({ tags: tag }).select('_id');
    const subcategoryIds = subcategories.map(sub => sub._id);

    if (subcategoryIds.length === 0) {
      return res.status(200).json([]);
    }

    const products = await Product.find({
      'categories.sub': { $in: subcategoryIds }
    });

    res.status(200).json(products);
  } catch (err) {
    console.error('Error getting products by tag:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};