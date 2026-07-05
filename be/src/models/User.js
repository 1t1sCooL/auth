const mongoose = require("mongoose");
const { ROLES } = require("../config/constants");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: ROLES.USER,
      enum: Object.values(ROLES),
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.statics.isValidEmail = (email) => emailRegex.test(email || "");

module.exports = mongoose.model("User", userSchema);
