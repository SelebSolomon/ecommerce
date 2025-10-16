## 1️⃣ **Authentication & Users**

Every e-commerce app needs secure user handling.

| Route                               | Method   | Purpose                                 |
| ----------------------------------- | -------- | --------------------------------------- |
| `/api/v1/auth/signup`               | POST     | Register a new user                     |
| `/api/v1/auth/login`                | POST     | Login user, return JWT                  |
| `/api/v1/auth/logout`               | GET/POST | Logout user (clear cookie/token)        |
| `/api/v1/auth/forgotPassword`       | POST     | Send password reset email               |
| `/api/v1/auth/resetPassword/:token` | PATCH    | Reset password via token                |
| `/api/v1/users/me`                  | GET      | Get current logged-in user info         |
| `/api/v1/users/me`                  | PATCH    | Update current user info (name/email)   |
| `/api/v1/users/me/password`         | PATCH    | Update password (old password required) |
| `/api/v1/users/me`                  | DELETE   | Deactivate user account (soft delete)   |

💡 **Pro Tip:** Always protect sensitive routes with `authController.protect` and role-based access for admins (`authController.restrictTo('admin')`).

------

## 2️⃣ **Products**

Beyond listing products, we need:

| Route                  | Method | Purpose                                           |
| ---------------------- | ------ | ------------------------------------------------- |
| `/api/v1/products`     | GET    | Get all products (with filters, pagination, sort) |
| `/api/v1/products/:id` | GET    | Get single product with reviews                   |
| `/api/v1/products`     | POST   | Add a new product (admin)                         |
| `/api/v1/products/:id` | PATCH  | Update product (admin)                            |
| `/api/v1/products/:id` | DELETE | Delete product (admin)                            |

💡 Include query features: filtering, sorting, field limiting, and pagination.

------

## 3️⃣ **Categories**

We already touched nested routes, but here’s the full picture:

| Route                             | Method | Purpose                                       |
| --------------------------------- | ------ | --------------------------------------------- |
| `/api/v1/categories`              | GET    | List all categories (optional tree structure) |
| `/api/v1/categories/:id`          | GET    | Get single category + its children            |
| `/api/v1/categories/:id/products` | GET    | Get products for category + children          |
| `/api/v1/categories`              | POST   | Add a new category (admin)                    |
| `/api/v1/categories/:id`          | PATCH  | Update category (admin)                       |
| `/api/v1/categories/:id`          | DELETE | Delete category (admin)                       |

💡 Nested children make the frontend product filtering easier.

------

## 4️⃣ **Reviews**

Products should have reviews and ratings.

| Route                                 | Method | Purpose                      |
| ------------------------------------- | ------ | ---------------------------- |
| `/api/v1/products/:productId/reviews` | POST   | Add review to product (auth) |
| `/api/v1/products/:productId/reviews` | GET    | List all reviews for product |
| `/api/v1/reviews/:id`                 | PATCH  | Update review (owner only)   |
| `/api/v1/reviews/:id`                 | DELETE | Delete review (owner/admin)  |

💡 Always link review to both `product` and `user` to avoid duplication.

------

## 5️⃣ **Cart / Orders**

The real e-commerce logic.

| Route                       | Method | Purpose                     |
| --------------------------- | ------ | --------------------------- |
| `/api/v1/cart`              | GET    | Get user’s current cart     |
| `/api/v1/cart`              | POST   | Add product to cart         |
| `/api/v1/cart/:productId`   | PATCH  | Update quantity             |
| `/api/v1/cart/:productId`   | DELETE | Remove product from cart    |
| `/api/v1/orders`            | POST   | Place order from cart       |
| `/api/v1/orders/:id`        | GET    | Get single order            |
| `/api/v1/orders`            | GET    | List all user orders        |
| `/api/v1/orders/:id/status` | PATCH  | Update order status (admin) |

💡 Keep inventory checks and transactional safety in mind.

------

## 6️⃣ **Wishlist / Favorites** (Optional but common)

| Route                         | Method | Purpose              |
| ----------------------------- | ------ | -------------------- |
| `/api/v1/wishlist`            | GET    | List wishlist items  |
| `/api/v1/wishlist`            | POST   | Add item to wishlist |
| `/api/v1/wishlist/:productId` | DELETE | Remove from wishlist |

------

## 7️⃣ **Payments**

| Route                            | Method | Purpose                         |
| -------------------------------- | ------ | ------------------------------- |
| `/api/v1/payments/create-intent` | POST   | Stripe/Paystack payment intent  |
| `/api/v1/payments/webhook`       | POST   | Listen for payment confirmation |

💡 Security: never trust frontend payment response. Always verify via webhook.

------

## 8️⃣ **Admin / Stats** (Optional)

| Route                    | Method | Purpose                               |
| ------------------------ | ------ | ------------------------------------- |
| `/api/v1/stats/products` | GET    | Get product stats (count, avg price)  |
| `/api/v1/stats/orders`   | GET    | Get order stats (total sales, status) |
| `/api/v1/stats/users`    | GET    | User stats (total, active, new)       |

💡 Useful for dashboards.

------

### 📝 **Pro Dev Notes**

- Use **nested routes** where it makes sense (`category/:id/products`, `product/:id/reviews`).
- Always **validate IDs** with `isValidObjectId` before querying.
- Use **populate** wisely, but avoid over-populating. Use lean queries if performance is a concern.
- Implement **pagination** for products, reviews, orders to avoid huge payloads.
- Protect admin routes using **role-based middleware**.