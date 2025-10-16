const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const Cart = require("../model/cartModel");
const Product = require("../model/productsModel");

exports.getUserCart = async (req, res, next) => {
  try {
    const cart = await Cart.find({ user: req.user.id });

    if (!cart) {
      return next(new AppError("Cart not found for this user", 404));
    }

    res.status(200).json({
      status: "success",
      data: { cart },
    });
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while getting all carts"));
  }
};

exports.addCart = async (req, res, next) => {
  try {
    // Find existing cart for user
    let cart = await Cart.findOne({ user: req.user.id });

    // Create new cart if none  exists for my database
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: req.body.items,
      });
    } else {
      // Merge items if cart exists by join them them together in
      req.body.items.forEach((newItem) => {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === newItem.product
        );
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.priceSnapshot = newItem.priceSnapshot;
        } else {
          // but if the item is new
          cart.items.push(newItem);
        }
      });
    }
    await cart.save(); // help run the presave middleware solo remember is always always on save or create
    response(res, 201, cart);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while adding Cart"));
  }
};

// exports.addCart = async (req, res, next) => {
//   try {
//     const itemsToAdd = req.body.items;
//     if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
//       return next(new AppError("No items provided", 400));
//     }

//     // 1) Fetch product data in bulk
//     const productIds = itemsToAdd.map(i => i.product);
//     const products = await Product.find({ _id: { $in: productIds } });

//     const productMap = new Map(products.map(p => [p._id.toString(), p]));

//     // 2) Prepare safe items
//     const preparedItems = itemsToAdd.map(i => {
//       const prod = productMap.get(i.product?.toString());
//       if (!prod) throw new AppError(`Product ${i.product} not found`, 404);

//       return {
//         product: prod._id,
//         quantity: Math.max(1, Number(i.quantity) || 1),
//         priceSnapshot: prod.price,
//         nameSnapshot: prod.name,
//         imageSnapshot:  prod.images,
//       };
//     });

//     // 3) Upsert cart
//     let cart = await Cart.findOne({ user: req.user.id });
//     if (!cart) {
//       cart = await Cart.create({ user: req.user.id, items: preparedItems });
//     } else {
//       preparedItems.forEach(newItem => {
//         const existing = cart.items.find(it => it.product.toString() === newItem.product.toString());
//         if (existing) {
//           existing.quantity += newItem.quantity;
//           existing.priceSnapshot = newItem.priceSnapshot;
//           existing.nameSnapshot = newItem.nameSnapshot;
//           existing.imageSnapshot = newItem.imageSnapshot;
//         } else {
//           cart.items.push(newItem);
//         }
//       });
//       await cart.save();
//     }

//     res.status(201).json({ status: "success", data: cart });
//   } catch (err) {
//     next(err);
//   }
// };


exports.updateCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      next(new AppError("Please enter 0 or more quantity", 400));
    }

    // 1️⃣ Find user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new AppError("No cart was found", 400));
    }
    // 2️⃣ Find the specific item
    const item = cart.items.id(itemId);
    console.log(item);
    if (!item) {
      return next(new AppError("NO item was found", 400));
    }

    // 3️⃣ Update quantity
    if (quantity === 0) {
      item.remove();
    } else {
      item.quantity = quantity;
      item.priceSnapshot = item.priceSnapshot;
    }

    await cart.save();
    response(res, 200, cart);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while updating the cart", 400));
  }
};

exports.deleteCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    console.log("ItemId from params:", itemId);

    // 1️⃣ Find user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new AppError("No cart was found", 400));
    }
    // 2️⃣ Find the specific item
    const item = cart.items.id(itemId);
    console.log(item);
    if (!item) {
      return next(new AppError("NO item was found", 400));
    }
    // DELETING CART
    await item.deleteOne();
    await cart.save();
    response(res, 200, cart);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while deleting a specific Cart", 400));
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    console.log(cart);

    if (!cart) {
      return next(new AppError("No cart found", 404));
    }
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.log(error.message);
    next(
      new AppError("Error while trying to Delete the entire cart of user", 400)
    );
  }
};
