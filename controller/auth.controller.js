const userModel = require("../models/user.models.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError.utils.js");
const catchAsync = require("../utils/catchAsync.utils");
const sendVerificationEmail = require("../utils/mailer.utils.js");
const crypto = require("crypto");
const { uploadBufferToCloudinary } = require("../utils/cloudinary.utils");

exports.register = catchAsync(async (req, res, next) => {
  const { userName, email, password, role, phone, address } = req.body;

  let imageUrl = "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg";
  if (req.file && req.file.buffer) {
    imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'users');
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const parsedUserName = userName ? JSON.parse(userName) : { en: '', ar: '' };
  const parsedAddress = address ? JSON.parse(address) : { en: '', ar: '' };

  const newUser = await userModel.create({
    userName: parsedUserName,
    email,
    password,
    role,
    phone,
    address: parsedAddress,
    image: imageUrl,
    verificationToken,
  });

  await sendVerificationEmail(email, verificationToken);

  res.status(202).json({
    message: "Check your email to verify your account",
    users: newUser,
  });
});


exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await userModel.findOne({ verificationToken: token });
  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification token." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;

  await user.save();

  res.status(200).json({ message: "Email verified successfully!" });
});
// exports.verifyEmail = catchAsync(async (req, res, next) => {
//   const { token } = req.params;

//   const user = await userModel.findOne({ verificationToken: token });
//   if (!user) {
//     return res.status(400).json({ message: "Invalid or expired verification token." });
//   }

//   user.isVerified = true;
//   user.verificationToken = undefined;

//   const phone = user.phone ? decrypt(user.phone) : null;
//   const address = {
//     en: user.address?.en ? decrypt(user.address.en) : null,
//     ar: user.address?.ar ? decrypt(user.address.ar) : null,
//   };

//   await user.save();

//   res.status(200).json({ 
//     message: "Email verified successfully!",
//     phone,
//     address
//   });
// });

exports.login = catchAsync(async (req, res, next) => {
  //  let{email,password}= req.body;
  let email = req.body.email || req.body.Email;
  let password = req.body.password || req.body.password;
  console.log('req.body:', req.body);

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "you must provide an email address and password" });
  }
  let user = await userModel.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "invalid email or password" });
  }
  let isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(404).json({ message: "invalid email or password" });
  }
  if (!user.isVerified) {
    return res
      .status(401)
      .json({ message: "Please verify your email before logging in." });
  }
  //valid email and password
  // token  ==> jwt

  let token = jwt.sign(
    {
      data: { id: user._id, email: user.email, role: user.role },
    },
    process.env.SECRET,
    { expiresIn: "1d" }
  );

  let refreshToken = jwt.sign(
    {
      data: { id: user._id, email: user.email, role: user.role },
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "15d" }
  );

  res.status(200).json({
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.userName,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  });
  
    await userModel.findOneAndUpdate(
    { _id: user._id },
    { refreshToken: refreshToken }
  );
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  let { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(403).json({ message: "refresh token is required" });
  }

  let decode = await promisify(jwt.verify)(
    refreshToken,
    process.env.REFRESH_SECRET
  );
  let user = userModel.findOne({ _id: decode._id });
  if (!user || user.refreshToken != refreshToken) {
    return res.status(403).json({ message: "invalid token" });
  } else {
    let token = jwt.sign(
      {
        data: { id: user._id, email: user.email, role: user.role },
      },
      process.env.SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({ token, refreshToken });
  }
});

exports.logout = catchAsync(async (req, res, next) => {
  const user = await userModel.findById(req.id);
  if (!user) {
    return next(new ApiError(404, "User not found."));
  }
  user.refreshToken = undefined;
  await user.save();
  res.status(200).json({ message: "Logged out successfully." });
});
