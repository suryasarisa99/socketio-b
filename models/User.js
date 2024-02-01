const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
    minlength: 3,
  },
  _id: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
    minlength: 3,
  },
});

module.exports = model("User", userSchema);
