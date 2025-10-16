const express = require("express");
const productController = require("../controller/productController");
const authController = require("../controller/authentication");
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(authController.protect, productController.getAllProducts)
  .post(productController.postProduct);

router
  .route("/getYearlySales/:year")
  .get(authController.protect, productController.getYearlySales);
router
  .route("/:id")
  .get(productController.getOne)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;
