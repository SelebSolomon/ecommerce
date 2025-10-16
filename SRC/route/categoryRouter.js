const express = require("express");
const categoryController = require("../controller/categoryController");
const authController = require('../controller/authentication')
const productController = require('../controller/productController')
const productRouter = require("./productRoute");

const router = express.Router();
// nexted route GET /categories/:id/products → all products in that category.
// GET /api/categories → get all categories.

// GET /api/categories/:id → get single category + its subcategories.

// POST /api/categories → create category (admin).

// PATCH /api/categories/:id → update category.

// DELETE /api/categories/:id → delete category.

router
.route("/")
.post(categoryController.createCategory)
.get(categoryController.getAllCategory);

router
.route("/:id")
.get(categoryController.getCategory)
.patch(categoryController.updateCategory)
.delete(categoryController.deleteCategory);

router
.route("/:id/products")
.get(productController.getCategoryProducts);

router.use("/:Categoryid/products", productRouter);
module.exports = router;
