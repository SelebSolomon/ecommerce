const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const Category = require("../model/categoryModel");

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    response(res, 201, category);
  } catch (error) {
    next(error);
  }
};

exports.getAllCategory = async (req, res, next) => {
  try {
    const category = await Category.find();
    response(res, 201, category);
  } catch (error) {
    next(error.message);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate({
        path: "children",
        select: "name slug description image",
      })
      .select("name slug description image parent children");

    if (!category) {
      return next(new AppError("Category not found", 404));
    }
    response(res, 200, category);
  } catch (error) {
    console.log(error.message);
    next(new AppError("Error while getting category", 400));
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    // should incase i add authentication

    // const category =  await Category.findById(id)

    //     if (category.user.toString() !== req.user.id && req.user.role !== "admin") {
    //   return next(
    //     new AppError("You are not allowed to update this review", 403)
    //   );
    const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    response(res, 200, updatedCategory);
  } catch (error) {
    next(new AppError("Error while trying to update the category", 400));
    console.log(error.message);
  }
};


exports.deleteCategory = async (req, res, next) => {

    try {
        await Category.findByIdAndDelete(req.params.id)
        res.status(201).json({status: 'success'})
    } catch (error) {
        console.log(error.message)
        next(new AppError('Error while deleting the Category'))
    }
}


