const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const User = require("../model/userModel");

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  //   response(res, 200, req.user);
  req.params.id = req.user.id;
  next();
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    response(res, 200, { user });
  } catch (error) {
    next(new AppError("User not found"));
    console.log(error.message);
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    const users = await User.find().select("name email role createdAt");
    response(res, 200, users);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      next(
        new AppError(
          "This route is not for update password, please use the /updatePassword",
          400
        )
      );
    }
    const filteredBody = filteredObj(req.body, "name", "email");
    const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      runValidators: true,
      new: true,
    }).select("name email role createdAt");

    response(res, 201, user);
  } catch (error) {}
};

exports.deleteMe = async (req, res, next) => {
  console.log("deleting");
  await User.findByIdAndUpdate(req.user.id, { status: "inactive" });

  res.status(200).json({ message: "Youve been made inactive", data: null });
};

exports.deleteUser = async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    message: "Youre has been deleted successfully",
  });
};

exports.suspendUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: "suspended" });

    res.status(204).json({ status: "success" });
  } catch (error) {
    next(error)
  }
};
