const Order = require("../model/orderModel");
const Product = require("../model/productsModel");
const Cart = require("../model/cartModel");
const { response } = require("../utils/response");
const AppError = require("../utils/AppError");
/*
this route is until i fix the cartModel that i highlighted and i am not still done here too
exports.createOrderFromCart = async (req, res, next) => {
  try {
    // 1) Get the logged-in user (req.user.id)
    const userId = req.user.id;
    // 2) Find the user’s cart
    //   - If no cart or empty items → return error ("Cart is empty")
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return next(new AppError("Cart is empty please fill up the cart", 400));
    }
    // 3) Prepare order data
    //   - Extract items from cart
    //   - For each item, store { productId, quantity, priceSnapshot }
    //   - Calculate totalPrice = sum(quantity * priceSnapshot)
    const orderProducts = cart.items.map((item) => ({
      product: item.product,
      nameSnapshot: item.nameSnapshot,
      imageSnapshot: item.imageSnapshot,
      quantity: item.quantity,
      price: item.priceSnapshot,
    }));
    // 4) Add extra order info
    const { paymentMethod, shippingAddress } = req.body;
    if (!paymentMethod || !shippingAddress) {
      return next(
        new AppError("Payment method and shipping address are required", 400)
      );
    }

    const totalPrice = orderProducts.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    // 5) Create the order in DB
    const order = await Order.create({
      user: userId,
      products: orderProducts,
      totalPrice,
      paymentMethod,
      shippingAddress,
      paymentStatus: "pending",
      shippingStatus: "pending",
      isActive: true,
    });
    // 6) Optional: Clear the user’s cart after successful order
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // 7) Return success response with order details

    res.status(201).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    console.log(error.message);
    next(new AppError("error" + error.message, 400));
  }
};
*/

exports.createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1) Get the user's cart
    const userCart = await Cart.findOne({ user: userId });
    if (!userCart || userCart.items.length === 0) {
      return next(new AppError("Cart is empty", 400));
    }

    // 2) Fetch products from DB
    const productIds = userCart.items.map((item) => item.product);
    const productsFromDB = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    productsFromDB.forEach((prod) => {
      productMap[prod._id.toString()] = prod;
    });

    // 3) Prepare order products
    const orderProducts = userCart.items
      .map((item) => {
        const dbProduct = productMap[item.product.toString()];
        if (!dbProduct) return null; // skip missing products

        return {
          product: item.product,
          quantity: item.quantity || 1,
          price: item.priceSnapshot || dbProduct.price,
          nameSnapshot: item.nameSnapshot || dbProduct.name,
          imageSnapshot: item.imageSnapshot || dbProduct.images?.[0] || "",
        };
      })
      .filter((item) => item !== null); // remove missing products

    if (orderProducts.length === 0) {
      return next(new AppError("No valid products in cart", 400));
    }

    // 4) Calculate total price
    const totalPrice = orderProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 5) Get payment & shipping info
    const { paymentMethod, shippingAddress } = req.body;
    if (!paymentMethod || !shippingAddress) {
      return next(
        new AppError("Payment method and shipping address are required", 400)
      );
    }

    // 6) Create the order
    const order = await Order.create({
      user: userId,
      products: orderProducts,
      totalPrice,
      paymentMethod,
      shippingAddress,
    });

    // 7) Clear the cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    response(res, 201, order);
    // key things i learn from this
    //     Use the filtered orderProducts when creating the order.

    // Only get dbProduct from productMap (no extra DB call inside .map).

    // Skip cart items with missing products.

    // Always ensure price comes from priceSnapshot or dbProduct.price.
  } catch (error) {
    console.log(error);
    next(
      new AppError(
        "Something went wrong while trying to create order from cart",
        400
      )
    );
  }
};

exports.myOrder = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("products totalPrice createdAt")
      .populate("products.product", "name images price");
    if (!orders || orders.length === 0) {
      return next(new AppError("No order found!", 404));
    }
    response(res, 200, orders);
  } catch (error) {
    console.log(error.message);
    next(
      new AppError("Error while sending custumers personal order reciept", 400)
    );
  }
};

// Get Single Order (GET /orders/:id)
// ➝ Like asking customer service for details about one specific order receipt.
exports.getOneOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("products totalPrice createdAt paymentStatus shippingStatus")
      .populate("products.product", "name images price");
    if (!order) {
      next(new AppError("No order found", 404));
    }

    response(res, 200, order);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while trying to get a single order", 400));
  }
};

// Get All Orders (Admin) (GET /orders)
// ➝ Like the store manager pulling up all transactions for analysis.
exports.AdminGettingAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.product", "name price");
    if (orders.length === 0) {
      return next(new AppError("No order was placed", 404));
    }
    response(res, 200, orders);
  } catch (error) {
    console.log(error.message);
    next(new AppError("error while getting all order", 404));
  }
};

// Update Order Status (PATCH /orders/:id)
// ➝ Like moving an order from pending → shipped → delivered in the backend system.
exports.updateOrStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("order not found!", 404));
    }

    if (req.user.role !== "admin") {
      return next(
        new AppError("you dont have the permission to edit this order", 403)
      );
    }

    const shippingStatuses = ["pending", "shipped", "delivered", "cancelled"];
    const paymentStatuses = ["pending", "paid", "failed", "refunded"];

    let { shippingStatus, paymentStatus } = req.body;

    if (shippingStatus && !shippingStatuses.includes(shippingStatus)) {
      return next(new AppError("invalid shipping status", 400));
    }

    if (paymentStatus && !paymentStatuses.includes(paymentStatus)) {
      return next(new AppError("invalid payment status", 400));
    }

    if (shippingStatus) order.shippingStatus = shippingStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    response(res, 200, order);
  } catch (error) {
    console.log(error.message);
    next(new AppError(error.message, 400));
  }
};
// Mark Order as Paid (PATCH /orders/:id/pay)
// ➝ Like confirming at the cashier that the payment went through.
exports.paid = async (req, res, next) => {
  try {
    // Extract order ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError("No order found with this id!", 404));
    }
    // Find order in DB

    // Check authorization
    if (req.user.role !== "user" && req.user.role !== "admin") {
      return next("You are not authorised", 400);
    }
    // Check current payment status
    if (order.paymentStatus === "paid") {
      return next(new AppError("You already paid for this order", 400));
    }
    // Update payment fields
    order.paymentStatus = "paid";
    order.paidAt = Date.now();
    order.transactionId = req.body.transactionId;
    order.paymentMethod = req.body.paymentMethod;

    // Save order
    await order.save();

    // send your response boy lol

    const {
      _id,
      paymentStatus,
      paidAt,
      transactionId,
      paymentMethod,
      totalPrice,
    } = order;

    response(res, 200, {
      orderId: _id,
      paymentStatus,
      paidAt,
      transactionId,
      paymentMethod,
      totalPrice,
    });
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error in payment", 400));
  }
};

// Cancel Order (PATCH /orders/:id/cancel)
// ➝ Like a customer calling to cancel their order before it’s shipped.
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError("NO order found!", 404));
    }
    if (!["user", "admin"].includes(req.user.role)) {
      return next("You are not authorised", 400);
    }

    if (order.shippingStatus === "canceled") {
      return next(new AppError("Order already canceled", 400));
    }
    if (
      order.shippingStatus === "shipped" ||
      order.shippingStatus === "delivered"
    ) {
      return next(new AppError("Order cant not be caneced!", 400));
    }
    order.shippingStatus = "canceled";
    order.canceledAt = Date.now();
    order.isActive = false;

    await order.save();

    const { _id, shippingStatus, canceledAt, paymentStatus } = order;

    response(res, 200, {
      OrderId: _id,
      shippingStatus,
      canceledAt,
      paymentStatus,
    });
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while canceling order", 400));
  }
};

// Delete Order (DELETE /orders/:id) (Admin only, optional)
// ➝ Like removing a fraudulent/duplicate order from the system.

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError("NO order was found" + req.params.id, 404));
    }
    if (req.user.role !== "admin") {
      return next(
        new AppError("Only admins have the right to delete order!", 403)
      );
    }

    if (
      order.paymentStatus === "paid" ||
      order.shippingStatus === "delivered"
    ) {
      return next(
        new AppError("Payment already made, cannot delete order", 400)
      );
    }

    order.isActive = false;
    await order.save();

    res.status(200).json({ status: "success", deleted: true });
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while deleting", 400));
  }
};

exports.directByOrder = async (req, res, next) => {
  // 1) Get the logged-in user (req.user.id)
  // 2) Get productId and quantity from req.body
  // 3) Fetch the product from DB to confirm it exists
  // 4) Prepare order data
  //   - Take product._id, quantity, product.price as snapshot
  //   - totalPrice = product.price * quantity
  // 5) Add extra order info
  //   - paymentMethod, shippingAddress (from req.body)
  //   - status = "pending"
  //   - isPaid = false
  // 6) Create the order in DB
  // 7) Return success response with order details
};
