const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUserProfile = async (req, res, next) => {
  const userId = req.params.uid;
  try {
    user = await User.findById(userId).populate("stories");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, Please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("could not find user with this ID.", 404);
    return next(error);
  }
  let userStories = [];
  if (userId.toString() === req.user._id.toString()) {
    userStories = user.stories;
  } else {
    userStories = user.stories.filter((story) => {
      return story.privacy !== true;
    });
  }
  res.json({ user: user, stories: userStories });
};

const editUserProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const userId = req.params.uid;
  const { bio, coverQuote, location } = req.body;
  try {
    editedUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not save the Update.",
      500
    );
    return next(error);
  }
  console.log(editedUser);

  if (editedUser._id.toString() !== req.user._id.toString()) {
    // console.log(typeof editedStory.userId.toString(), typeof req.user._id);
    const error = new HttpError(
      "You could not update this user with this ID.",
      401
    );
    return next(error);
  }
  editedUser.bio = bio;
  editedUser.coverQuote = coverQuote;
  editedUser.location = location;
  try {
    await editedUser.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not save the Update.",
      500
    );
    return next(error);
  }
  res.status(200).json({ editedUser: editedUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { _id: existingUser._id, userName: existingUser.userName },
      "secret_token",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({
    _id: existingUser._id,
    userName: existingUser.userName,
    token: token,
  });
};
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { email, userName, password, bio, coverQuote, location } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }
  let hashPassword;
  try {
    hashPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("could not create user. please try again", 500);
    return next(error);
  }
  const createdUser = new User({
    email,
    password: hashPassword,
    bio,
    coverQuote,
    location,
    userName,
    imageUrl: "",
    stories: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  let token;
  try {
    await jwt.sign(
      { _id: createdUser._id, userName: userName },
      "secret_token",
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  res.status(201).json({
    _id: createdUser._id,
    userName: createdUser.userName,
    token: token,
  });
};

exports.getUserProfile = getUserProfile;
exports.editUserProfile = editUserProfile;
exports.login = login;
exports.signup = signup;
