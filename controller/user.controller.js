const userModel = require("../models/user.models.js");
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils.js");
const bcrypt = require("bcryptjs");
const { uploadBufferToCloudinary } = require("../utils/cloudinary.utils");


exports.getAllUser = catchAsync(async (req, res, next) => {
  let users = await userModel.find();
  if (users.length === 0) {
    return res.status(404).json({ message: "users do Not Exist" });
  }

  const newUsers = users.map((user) => user.toObject());

  res.status(200).json({ message: "success", users: newUsers });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let user = await userModel.findById(id);
  if (!user) {
    return next(new ApiError(404, "User does not found"));
  }

  res.status(200).json({ message: "success", user: user.toObject() });
});

exports.deleteUserById = catchAsync(async (req, res, next) => {
  let { id } = req.params;
  await userModel.findByIdAndDelete(id);
  res.status(204).json();
});

exports.updateUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let { phone, address, userName, ...rest } = req.body;

  try {
    if (typeof userName === "string") userName = JSON.parse(userName);
    if (typeof address === "string") address = JSON.parse(address);
  } catch (err) {
    return next(new ApiError(400, "Invalid JSON in userName or address"));
  }

  if (phone && !/^(011|010|012|015)[0-9]{8}$/.test(phone)) {
    return next(new ApiError(400, "Invalid phone number format"));
  }

  if (address?.en && address.en.length < 2) {
    return next(new ApiError(400, "Address (EN) must be at least 2 characters"));
  }

  if (address?.ar && address.ar.length < 2) {
    return next(new ApiError(400, "Address (AR) must be at least 2 characters"));
  }

  const updatedData = { ...rest };
  if (phone) updatedData.phone = phone;
  if (address?.en) updatedData["address.en"] = address.en;
  if (address?.ar) updatedData["address.ar"] = address.ar;
  if (userName?.en) updatedData["userName.en"] = userName.en;
  if (userName?.ar) updatedData["userName.ar"] = userName.ar;

  if (req.file && req.file.buffer) {
    const imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'users');
    updatedData.image = imageUrl;
  }

  const updatedUser = await userModel.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: false,
  });

  if (!updatedUser) {
    return next(new ApiError(404, "User not found"));
  }

  res.status(200).json({ message: "User updated successfully", user: updatedUser.toObject() });
});




exports.changePassword = catchAsync(async (req, res, next) => {
const id = req.user.id || req.user._id || req.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await userModel.findById(id);
  if (!user) return next(new ApiError(404, "User not found"));

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return next(new ApiError(401, "Old password is incorrect"));

  if (newPassword !== confirmPassword) {
    return next(
      new ApiError(400, "New password and confirmation do not match")
    );
  }

  if (newPassword.length < 8) {
    return next(new ApiError(400, "Password must be at least 8 characters"));
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
});

// GET /api/users/count
exports.getAllUsersCount = catchAsync(async (req, res, next) => {
  const count = await userModel.countDocuments(); 
  res.status(200).json({ totalUsers: count });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const id = req.user.id || req.user._id || req.id; // تأكد من طريقة استخراج id من ال auth middleware

  let { phone, address, userName, ...rest } = req.body;

  try {
    if (typeof userName === "string") userName = JSON.parse(userName);
    if (typeof address === "string") address = JSON.parse(address);
  } catch (err) {
    return next(new ApiError(400, "Invalid JSON in userName or address"));
  }

  if (phone && !/^(011|010|012|015)[0-9]{8}$/.test(phone)) {
    return next(new ApiError(400, "Invalid phone number format"));
  }

  if (address?.en && address.en.length < 2) {
    return next(new ApiError(400, "Address (EN) must be at least 2 characters"));
  }

  if (address?.ar && address.ar.length < 2) {
    return next(new ApiError(400, "Address (AR) must be at least 2 characters"));
  }

  const updatedData = { ...rest };
  if (phone) updatedData.phone = phone;
  if (address?.en) updatedData["address.en"] = address.en;
  if (address?.ar) updatedData["address.ar"] = address.ar;
  if (userName?.en) updatedData["userName.en"] = userName.en;
  if (userName?.ar) updatedData["userName.ar"] = userName.ar;

  if (req.file && req.file.buffer) {
    const imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'users');
    updatedData.image = imageUrl;
  }

  const updatedUser = await userModel.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: false,
  });

  if (!updatedUser) {
    return next(new ApiError(404, "User not found"));
  }

  res.status(200).json({ message: "User updated successfully", user: updatedUser.toObject() });
});