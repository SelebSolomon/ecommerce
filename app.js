const express = require("express");
// Run cron jobs
require("./SRC/utils/cleanupOrders");

const userRouter = require("./SRC/route/userRoute");
const productRouter = require('./SRC/route/productRoute')
const reviewRouter = require('./SRC/route/reviewRoute')
const globalErrorHandler = require('./SRC/controller/errorhandling');
const categoryRouter = require('./SRC/route/categoryRouter')
const cartRouter = require('./SRC/route/cartRoute')
const orderRouter = require('./SRC/route/orderRoute')
const app = express();
app.use(express.json())

app.use('/api/v1/user/', userRouter)
app.use('/api/v1/products/', productRouter)
app.use('/api/v1/review/', reviewRouter)
app.use('/api/v1/category', categoryRouter)
app.use('/api/v1/cart' , cartRouter)
app.use('/api/v1/order', orderRouter)


app.use(globalErrorHandler)
module.exports = app;
