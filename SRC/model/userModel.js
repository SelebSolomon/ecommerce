const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minLength: 8,
    },
    confirmPassword: {
      type: String,
      required: [true, "Please provide a password"],
      validate: {
        validator: function (val) {
          // let me not forget again that it only works for create and save and not updating
          return val === this.password;
        },
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // active: {
    //   type: Boolean,
    //   default: true,
    //   select: false,
    // },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  this.confirmPassword = undefined;
  next();
});

// my fav hack to set settpassword before change
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  return next();
});
// To prevent inactive users from appearing in any find query:
// userSchema.pre(/^find/, function (next) {
//   this.find({ status: { $ne: "inactive"} });
//   next();
// });

// this compare password
userSchema.methods.correctPassword = async function (
  currentPassword,
  userPassword
) {
  return await bcrypt.compare(currentPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < changedTimestamp;
  }
  return false;
};
// what to return and what to leave
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password;
    delete ret.passwordResetExpires;
    delete ret.passwordChangedAt;
    delete ret.passwordResetExpires;

    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
