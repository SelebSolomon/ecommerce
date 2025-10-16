// Cart Routes

// Get current user’s cart
// GET /api/v1/cart

// Add item to cart
// POST /api/v1/cart

// Update item quantity in cart
// PATCH /api/v1/cart/:itemId

// Remove item from cart
// DELETE /api/v1/cart/:itemId

// Clear entire cart
// DELETE /api/v1/cart

// Optional: Calculate total price
// (usually part of GET /api/v1/cart or handled automatically in middleware)

const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const authController = require("../controller/authentication");

router
  .route("/")
  .get(authController.protect, cartController.getUserCart)
  .post(authController.protect, cartController.addCart)
  .delete(authController.protect, cartController.clearCart);
router
  .route("/:itemId")
  .patch(authController.protect, cartController.updateCart)
  .delete(authController.protect, cartController.deleteCartItem);

module.exports = router;
