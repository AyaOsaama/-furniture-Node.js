let express = require("express");
let router = express.Router();
let {
  register,
  login,
  refreshToken,
  verifyEmail,
  logout,
} = require("../controller/auth.controller.js");
let { auth } = require("../Middleware/auth.middleware");
// Multer to save Images
const upload = require("../utils/multer.utils.js");

//EndPoints

router.route("/register").post(upload.single("image"), register);
router.post("/login", login);
router.post("/refreshToken", refreshToken);
router.get("/verify/:token", verifyEmail);
router.post("/logout", auth, logout);
module.exports = router;
