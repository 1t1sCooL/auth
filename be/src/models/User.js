const mongoose = require("mongoose");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
