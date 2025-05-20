const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
let userSchema = mongoose.Schema(
  {
    userName: {
      en: { type: String, minlength: 3, maxlength: 10 },
      ar: { type: String, minlength: 3, maxlength: 20 },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail)\.com$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Email`,
      },
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
    },
    image: { type: String },
    role: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },
    refreshToken: { type: String },
    phone: { type: String, trim: true },
    address: {
      en: { type: String, trim: true },
      ar: { type: String, trim: true },
    },
    wishlist: [{ type: mongoose.SchemaTypes.ObjectId, ref: "products" }],
    ispurchased: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Product" }],
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }


  next();
});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
