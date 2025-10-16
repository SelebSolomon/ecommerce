const User = require("../model/userModel");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendMail = require("../utils/email");
const { promisify } = require("util");

// const bcrypt = require("bcrypt");

const signtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_DATE,
  });
};

const createToken = (user, res, statusCode) => {
  const token = signtoken(user._id);
  const cookiesOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookiesOption);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const user = await User.create(req.body);

    createToken(user, res, 201);
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return new Error("Invalid fields");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Email or password is incorrect", 400));
    }
    //  Handle account status
    if (user.status === "suspended") {
      return next(
        new AppError("Your account is suspended. Contact support.", 403)
      );
    }

    if (user.status === "inactive") {
      // flip back to active once login succeeds
      user.status = "active";
      await user.save({ validateBeforeSave: false });
    }
    
    createToken(user, res, 201);
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have the permission to perform this action", 401)
      );
    }
    next();
  };
};

exports.protect = async (req, res, next) => {
  let token;
  try {
    // 1) Getting  the token and checking if its there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }

    // 2) Verifying the token by decoding it
    let decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if the currentUser  still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError("The user no longer exists.", 401));
    }

    // 4) check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      next(new AppError("Password was changed not too long ago", 403));
    }

    //granting them access
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError("Token is invalid", 403));
  }
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get the email from the request body
  const { email } = req.body;

  // 2) Check if the user with this email exists
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Email does not exist", 404));
  }

  // 3) Generate a random reset token using crypto
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 4) Hash the token and save it to user schema
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 5) Save the user without running validation
  await user.save({ validateBeforeSave: false });

  // 6) Build reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/resetPassword/${resetToken}`;
  const message = `forgeot your password? submit a patch request with your new password and a confirm password to this url ${resetURL} \n if you didn't forget your password please ignore this email `;

  try {
    // 7) Message for email
    await sendMail({
      email: user.email,
      subject: "Your email is only valid for 10 mins",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent successfully",
    });
  } catch (error) {
    // 8) If email sending fails, reset token fields
    user.resetPasswordToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        "There was an error sending the email. Try again later.",
        500
      )
    );
    console.log(error.message);
  }
};

exports.resetPassword = async (req, res, next) => {
  // I will rehash it from the token coming from the url
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 1 GET USER BASED ON TOKEN
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // IF TOKEN HAS NOT EXPIRED AND THERE IS A USER,
  if (!user) {
    return next(new AppError("Token has expired try again"));
  }

  //when passed everything set the password SET THE NEW USER
  user.password = req.body.password;
  user.confirmPassword = req.body.password;
  user.resetPasswordToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // to change the date at the so that to keep track when token was created
  if (user.isModified("password") && !user.isNew) {
    user.passwordChangedAt = Date.now() - 1000;
  }

  createToken(user, res, 201);
};

exports.updatePassword = async (req, res, next) => {
  // geting the id from the protect middleware
  console.log("user");

  const user = await User.findById(req.user.id).select("+password");

  // i have to also compare the old password
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError("Your old password is incorrect", 400));
  }

  // so if its correct update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();

  createToken(user, res, 200);
};
