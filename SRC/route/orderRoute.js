// | Route                | Purpose                                       |
// | -------------------- | --------------------------------------------- |
// | `GET /orders`        | List all orders for the logged-in user        |
// | `GET /orders/:id`    | Get details of one order                      |
// | `POST /orders`       | Checkout / create a new order from the cart   |
// | `PATCH /orders/:id`  | Update order status (admin or business logic) |
// | `DELETE /orders/:id` | Cancel order if allowed                       |
// Create Order (POST /orders)
// ➝ Like when a customer checks out at the supermarket and pays for items.

// Take their cart + shipping + payment method and create an order record.

// Get My Orders (GET /orders/my-orders)
// ➝ Like giving a customer their purchase history receipt booklet.

// User sees only their own past orders.

// Get Single Order (GET /orders/:id)
// ➝ Like asking customer service for details about one specific order receipt.

// Get All Orders (Admin) (GET /orders)
// ➝ Like the store manager pulling up all transactions for analysis.

// Update Order Status (PATCH /orders/:id)
// ➝ Like moving an order from pending → shipped → delivered in the backend system.

// Mark Order as Paid (PATCH /orders/:id/pay)
// ➝ Like confirming at the cashier that the payment went through.

// Cancel Order (PATCH /orders/:id/cancel)
// ➝ Like a customer calling to cancel their order before it’s shipped.

// Delete Order (DELETE /orders/:id) (Admin only, optional)
// ➝ Like removing a fraudulent/duplicate order from the system.

const express = require("express");

const router = express.Router();
const orderController = require("../controller/orderController");
const authController = require("../controller/authentication");

router.route("/my-orders").get(authController.protect, orderController.myOrder);

router
  .route("/")
  .post(authController.protect, orderController.createOrderFromCart)
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    orderController.AdminGettingAllOrders
  );
router
  .route("/:id")
  .get(authController.protect, orderController.getOneOrder)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    orderController.updateOrStatus
  );

router
  .route("/:id/paid")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "user"),
    orderController.paid
  );
router
  .route("/:id/cancel")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "user"),
    orderController.cancelOrder
  );

  router
  .route("/:id/cancel")
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    orderController.deleteOrder
  );
module.exports = router;
