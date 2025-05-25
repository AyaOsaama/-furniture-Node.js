const ProductModel = require("../models/product.models.js");
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils.js");
const QueryFeatures = require("../utils/queryFeatures.utils.js");
const { uploadBufferToCloudinary } = require("../utils/cloudinary.utils.js");
// controllers/productController.js
const Product = require('../models/product.models.js');  

const Subcategory = require("../models/subcategory.model.js");

exports.updateProduct = catchAsync(async (req, res, next) => {
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  const { brand, categories, description, material } = req.body;
  let { variants } = req.body; // استقبل الـ variants كـ String

  const parsedCategories = categories ? JSON.parse(categories) : { main: '', sub: '' };
  const parsedDescription = description ? JSON.parse(description) : { en: '', ar: '' };
  const parsedMaterial = material ? JSON.parse(material) : { en: '', ar: '' };


  let parsedVariants = [];
  try {
    const parsed = JSON.parse(variants);
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsedVariants = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      parsedVariants = [parsed];
    } else if (typeof variants === 'string' && variants === "") {
      parsedVariants = [];
    } else {
      return next(new ApiError('Invalid variants format', 400));
    }
  } catch (error) {
    return next(new ApiError('Invalid variants format', 400));
  }

  const mainVariantImage = req.files?.variantImage?.[0]
    ? await uploadBufferToCloudinary(req.files.variantImage[0].buffer)
    : null;

  const additionalVariantImages = req.files?.variantImages?.length > 0
    ? await Promise.all(req.files.variantImages.map(file => uploadBufferToCloudinary(file.buffer)))
    : [];

  if (parsedVariants.length > 0) {
    if (mainVariantImage) parsedVariants[0].image = mainVariantImage;
    if (additionalVariantImages.length > 0) parsedVariants[0].images = additionalVariantImages;
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    req.params.id,
    {
      brand,
      categories: parsedCategories,
      description: parsedDescription,
      material: parsedMaterial,
      variants: parsedVariants // استخدم الـ Array اللي تم تحليله
    },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) return next(new ApiError(404, "Product not found"));

  res.status(200).json({ message: "Product updated", product: updatedProduct });
});


exports.getAllProducts = catchAsync(async (req, res, next) => {
  const totalCount = await ProductModel.countDocuments();

  const features = new QueryFeatures(ProductModel.find(), req.query)
    .search()
    .filter();
    // .paginate(); // فعّليه لو بتستخدمي pagination

  const products = await features.query.populate([
    {
      path: 'categories.main',
      select: 'name'
    },
    {
      path: 'categories.sub',
      select: 'name tags'
    }
  ]);

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
    "name"   // نفس التعديل هنا
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
  console.log(`[DELETE PRODUCT] جاري محاولة حذف المنتج بالمعرف: ${product}`);

  if (!product) return next(new ApiError(404, "Product not found"));
  res.status(200).json({ message: "Product deleted" });
});


exports.addVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  const {
    name,          
    color,         
    price,         
    discountPrice, 
    inStock,       
  } = req.body;

  let parsedName;
  let parsedColor;

  try {
    parsedName = name ? JSON.parse(name) : {}; 
    parsedColor = color ? JSON.parse(color) : {}; 
  } catch (error) {
    return next(new ApiError(400, 'Invalid JSON format for name or color.'));
  }

  
  const newVariantData = {
    name: parsedName,
    price: Number(price), 
    color: parsedColor,
    inStock: Number(inStock),
    discountPrice: discountPrice ? Number(discountPrice) : undefined, 
  };


  if (newVariantData.discountPrice !== undefined && newVariantData.discountPrice >= newVariantData.price) {
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

 
  if (image) {
    newVariantData.image = image;
  }
  if (images.length > 0) {
    newVariantData.images = images;
  }


  product.variants.push(newVariantData);

  await product.save(); 

  res.status(200).json({ message: "Variant added", product });
});



exports.deleteVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  const variantId = req.params.variantId;
  const variant = product.variants.id(variantId);
  if (!variant) return next(new ApiError(404, "Variant not found"));

  // variant.remove();
  await variant.deleteOne(); // قم بإزالة الفاريانت من المصفوفة
  await product.save();

  res.status(200).json({ message: "Variant deleted", product });
});


exports.updateVariant = catchAsync(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  const variant = product.variants.id(req.params.variantId);
  if (!variant) {
    return next(new ApiError(404, "Variant not found"));
  }

  const {
    name,
    color,
    price,
    discountPrice,
    inStock,
    removeMainImage, // لحذف الصورة الرئيسية
    retainedImages // للاحتفاظ بالصور الإضافية القديمة
  } = req.body;

  let parsedName;
  let parsedColor;

  try {
    // 4. تحليل البيانات النصية (name, color)
    // استخدم القيمة الموجودة في الفاريانت كـ fallback لو لم يتم إرسال قيمة جديدة
    parsedName = name ? JSON.parse(name) : variant.name;
    parsedColor = color ? JSON.parse(color) : variant.color;
  } catch (error) {
    console.error("Error parsing name or color JSON:", error); // سجل الخطأ للمراجعة
    return next(new ApiError(400, 'Invalid JSON format for name or color.'));
  }

  // 5. تحديث خصائص الفاريانت مباشرة
  // تأكد من تحديث كل حقل تم إرساله
  if (name !== undefined) variant.name = parsedName;
  if (color !== undefined) variant.color = parsedColor;
  if (price !== undefined) variant.price = Number(price);
  if (inStock !== undefined) variant.inStock = Number(inStock);

  // تحديث سعر الخصم. إذا لم يتم إرساله أو كان فارغًا، اجعله undefined
  variant.discountPrice = (discountPrice !== undefined && discountPrice !== '') ? Number(discountPrice) : undefined;


  // 6. التحقق من صحة السعر المخفض
  if (variant.discountPrice !== undefined && variant.discountPrice >= variant.price) {
    return next(new ApiError(400, "Discount price must be less than the actual price"));
  }

  // 7. التعامل مع الصورة الرئيسية (Main Image)
  if (req.files?.image?.[0]) {
    // لو تم رفع صورة رئيسية جديدة
    variant.image = await uploadBufferToCloudinary(req.files.image[0].buffer);
  } else if (removeMainImage === 'true' && variant.image) {
    // لو تم طلب حذف الصورة الرئيسية وكانت موجودة
    // هنا يمكنك إضافة كود لحذف الصورة من Cloudinary إذا أردت
    // مثال: await deleteImageFromCloudinary(variant.image.public_id);
    variant.image = null; // اجعلها null في الداتابيز
  }
  // لو لم يتم إرسال صورة جديدة ولم يتم طلب حذف، ستبقى الصورة القديمة كما هي (variant.image)


  // 8. التعامل مع الصور الإضافية (Additional Images)
  let newAdditionalImages = [];
  if (req.files?.images?.length > 0) {
    // رفع الصور الإضافية الجديدة
    newAdditionalImages = await Promise.all(
      req.files.images.map(file => uploadBufferToCloudinary(file.buffer))
    );
  }

  let retainedVariantImages = [];
  if (retainedImages) {
    try {
      // الـ Frontend بيرسل retainedImages كـ JSON string من الـ URLs
      const parsedRetainedImages = JSON.parse(retainedImages);
      if (Array.isArray(parsedRetainedImages)) {
        // فلترة الصور الموجودة بالفعل في الفاريانت والتي تم طلب الاحتفاظ بها
        retainedVariantImages = variant.images.filter(img => parsedRetainedImages.includes(img.url));
      }
    } catch (error) {
      console.error("Error parsing retainedImages JSON:", error);
      // يمكنك إرسال خطأ للـ frontend أو تجاهل المشكلة هنا
    }
  }
  // دمج الصور القديمة التي تم الاحتفاظ بها مع الصور الجديدة التي تم رفعها
  variant.images = [...retainedVariantImages, ...newAdditionalImages];


  // 9. حفظ المنتج بعد التعديلات (هذا سيحفظ الفاريانت أيضاً)
  await product.save();

  // 10. إرسال الاستجابة: استخدم .toObject() لتجنب مشكلة الـ Circular Reference
  res.status(200).json({ message: "Variant updated", product: product.toObject() });
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

    // 1. Get the current product مع populated categories
    const currentProduct = await ProductModel.findById(productId)
      .populate("categories.main categories.sub", "name tags");
    if (!currentProduct) return res.status(404).json({ message: "Product not found" });

    // 2. Get the subcategory and its tags
    const subcategory = await Subcategory.findById(currentProduct.categories.sub._id);
    if (!subcategory || !subcategory.tags || subcategory.tags.length === 0) {
      return res.json([]); // No tags, return empty list
    }

    // 3. Get products whose subcategory has at least one common tag
    const relatedSubcategories = await Subcategory.find({
      tags: { $in: subcategory.tags }
    });

    const relatedSubcategoryIds = relatedSubcategories.map(sc => sc._id);

    // 4. Get related products that are not the current product مع populated categories
    const relatedProducts = await ProductModel.find({
      _id: { $ne: currentProduct._id },
      "categories.sub": { $in: relatedSubcategoryIds }
    }).populate("categories.main categories.sub", "name tags");

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getProductsByTag = async (req, res) => {
  const { tag } = req.params;
  try {
    console.log('Tag:', tag);

    const subcategories = await Subcategory.find({ tags: tag }).select('_id');
    console.log('Subcategories:', subcategories);

    const subcategoryIds = subcategories.map(sub => sub._id);
    console.log('Subcategory IDs:', subcategoryIds);

    if (subcategoryIds.length === 0) {
      return res.status(200).json([]);
    }

    const products = await Product.find({
      'categories.sub': { $in: subcategoryIds }
    }).populate("categories.main categories.sub", "name tags");

    console.log('Products:', products.length);
    res.status(200).json(products);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

