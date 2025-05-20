const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subcategory", subcategorySchema);
