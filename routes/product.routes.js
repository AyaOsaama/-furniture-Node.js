let express = require("express");
let router = express.Router();
let { auth } = require("../Middleware/auth.middleware.js");
const upload = require("../utils/multer.utils.js");
let {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  deleteVariant,
  updateVariant,
  getLowStockVariants,
  getDiscountedVariantsCount,
  getTopRatedProducts,getBrandsCount,getTotalVariants,getTotalProducts,
  getRelatedProductsByTags,
  getProductsByTag
} = require("../controller/product.controller.js");

//Protect
// router.use(auth);

//EndPoints
router
  .route("/")
  .post(
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 5 },
      { name: "variantImage", maxCount: 1 },
      { name: "variantImages", maxCount: 5 },
    ]),
    createProduct
  )
    .get(getAllProducts);

// Analytics Enpoints

router.get('/total-products', getTotalProducts);
router.get('/total-variants', getTotalVariants);
router.get('/brands-count', getBrandsCount);
router.get('/top-rated', getTopRatedProducts);
router.get('/discounted-variants', getDiscountedVariantsCount);
router.get('/low-stock', getLowStockVariants);
router.get('/related/:productId', getRelatedProductsByTags);
router.get('/tag/:tag', getProductsByTag);

// -----------------------
router.route("/:id")
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

router.post(
  "/:id/variants",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  addVariant
);
router.delete("/:id/variants/:variantId", deleteVariant);
router.patch(
  "/:id/variants/:variantId",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  updateVariant
);


module.exports = router;

module.exports = router;
