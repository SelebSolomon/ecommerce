const { isValidObjectId } = require("mongoose");
const Product = require("../model/productsModel");
const Category = require('../model/categoryModel')
const AppError = require("../utils/AppError");
const { response } = require("../utils/response");

exports.getAllProducts = async (req, res, next) => {
  const queryObj = { ...req.query };

  try {
    // here i will filter

    const excludedFields = ["sort", "limit", "page", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryString = JSON.stringify(queryObj);

    let query = Product.find(JSON.parse(queryString)).select(
      "name price stock description createdAt"
    );

    // here i want to sort
    if (req.query.sort) {
      let sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // fields limiting
    if (req.query.fields) {
      let fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }
    // pagination funny i am doing well lol
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      let numberOfdocument = await Product.countDocuments();
      if (skip >= numberOfdocument) {
        return next(new AppError("page is not defined", 404));
      }
    }

    const products = await query;
    res.status(200).json({
      status: "success",
      result: products.length,
      data: {
        data: products,
      },
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.getOne = async (req, res, next) => {
  const id = req.params.id;
  try {
    const product = await Product.findById(id).populate({
      path: "reviews",
      select: "review rating createdAt",
      populate: { path: "user", select: "name" },
    });
    if (!(isValidObjectId(id))) {
      return new AppError("No product was found", 400);
    }

    response(res, 200, product);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Can not get the product", 404));
  }
};

exports.postProduct = async (req, res, next) => {
  try {
    const createdItem = await Product.create(req.body);

    response(res, 201, createdItem);
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    response(res, 201, updatedProduct);
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    response(
      res,
      201,
      (data = "because we gave you the permission to delete werey lol")
    );
  } catch (error) {
    next(new AppError("Unable to delete this product"));
  }
};

exports.getYearlySales = async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Product.aggregate([
    {
      $unwind: "$date",
    },
    {
      $match: {
        date: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$date" },
        numberOfProducts: { $sum: 1 },
        products: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: {
          $arrayElemAt: [
            [
              "", // index 0 (unused)
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            "$_id", // use the month number (1–12) as index
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  response(res, 200, plan);
};
exports.getCategoryProducts = async (req, res, next) => {
  try {
    // 1️⃣ Fetch the category and its children
    const category = await Category.findById(req.params.id).populate("children");

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    let categoryIds;

    // 2️⃣ If category has children, include their IDs
    if (category.children && category.children.length > 0) {
      categoryIds = [category._id, ...category.children.map(c => c._id)];
    } else {
      // 3️⃣ If it's a leaf category, only use its own ID
      categoryIds = [category._id];
    }

    console.log("Fetching products for category IDs:", categoryIds);

    // 4️⃣ Fetch products that belong to the category or its children
    const products = await Product.find({ category: { $in: categoryIds } });

    // 5️⃣ Send back a proper response
    response(res, 200, {
      results: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    next(new AppError("Error fetching products for category", 400));
  }
};


   