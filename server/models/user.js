const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  submissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "submission",
    },
  ],
});

module.exports = mongoose.model("user", UserSchema);
