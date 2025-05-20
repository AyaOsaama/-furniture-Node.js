const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    subcategoriesId: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
    ],
    image: { type: String },
    description: {
      en: { type: String },
      ar: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
