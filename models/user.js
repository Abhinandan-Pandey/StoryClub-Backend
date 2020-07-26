const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  bio: {
    type: String,
    required: true,
  },
  coverQuote: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  imageUrl: {
    type: String,
  },
  stories: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Story",
    },
  ],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
