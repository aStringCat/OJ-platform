const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  submissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "submission",
    },
  ],
});

module.exports = mongoose.model("user", UserSchema);
