let express = require("express");
let router = express.Router();
let {
  auth,
  restrictTo,
  validateChangePasswordInput,
} = require("../Middleware/auth.middleware.js");
let {
  getAllUser,
  getUserById,
  deleteUserById,
  updateUserById,
  changePassword,
  getAllUsersCount,
  updateMe
} = require("../controller/user.controller.js");
const upload = require("../utils/multer.utils.js");

//Protect
// router.use(auth);

//EndPoints
router.patch("/me", upload.single("image"), updateMe);

router.route("/").get(restrictTo("admin", "super_admin"), getAllUser);
router.route("/count").get( getAllUsersCount);

router
  .route("/:id")
  .get( getUserById)
  .delete(restrictTo("admin", "super_admin"), deleteUserById)
  .patch(upload.single("image"),restrictTo("admin", "super_admin"),updateUserById);
  
router.patch(
  "/changePassword",

  validateChangePasswordInput,
  changePassword
);

module.exports = router;
