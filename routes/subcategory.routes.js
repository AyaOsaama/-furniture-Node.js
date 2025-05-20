const express = require("express");
const router = express.Router();
const {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} = require("../controller/subcategory.controller.js");

router.post("/", createSubcategory);
router.get("/", getAllSubcategories);
router.get("/:id", getSubcategoryById);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);

module.exports = router;
