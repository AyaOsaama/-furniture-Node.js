const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const ApiError = require("../utils/ApiError.utils.js");

exports.auth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return next(new ApiError(401, "You must login first"));
  }
  try {
    const token = authorization?.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : authorization;
    let decode = await promisify(jwt.verify)(token, process.env.SECRET);
    console.log("Decode", decode);
    req.role = decode.data.role;
    req.id = decode.data.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "you are not authenticated" });
  }
};

exports.restrictTo = (...roles) => {
  return function (req, res, next) {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: "you are not authorized" });
    } else {
      next();
    }
  };
};
exports.validateChangePasswordInput = (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "All password fields are required" });
  }
  next();
};
