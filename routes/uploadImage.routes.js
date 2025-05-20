let express = require("express");
let router = express.Router();
const upload = require("../utils/multer.utils");
const { restrictTo } = require("../Middleware/auth.middleware"); 
const {uploadUserImage} = require('../controller/uploadImage.controler')
router.post(
  "/",
  restrictTo("admin", "super_admin"),
  upload.single("image"),
  uploadUserImage
);
module.exports = router;