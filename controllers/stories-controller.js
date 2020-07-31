const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Story = require("../models/story");
const User = require("../models/user");

const getPublicStories = async (req, res, next) => {
  let stories;
  try {
    stories = await Story.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find any Story.",
      500
    );
    return next(error);
  }
  // console.log(stories, "stories");
  // if (stories.length === 0) {
  //   const error = new HttpError("No Post Found.", 404);
  //   return next(error);
  // }
  const publicStories = stories.filter((story) => {
    // console.log(story.privacy);
    return story.privacy !== true;
  });
  res.json({ stories: publicStories });
};

const postStory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, body, privacy } = req.body;

  const createdStory = new Story({
    title,
    body,
    privacy,
    createdBy: req.user.userName,
    userId: req.user,
  });

  let user;
  try {
    // console.log("userId:", req.user._id);
    user = await User.findById({ _id: req.user._id });
  } catch (err) {
    const error = new HttpError("Posting Story failed, please try again.", 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdStory.save({ session: session });
    user.stories.push(createdStory);
    await user.save({ session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not Post Story.",
      500
    );
    return next(error);
  }
  res.status(201).json({ story: createdStory });
};

const editStory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, body, privacy } = req.body;
  const storyId = req.params.sid;
  // console.log(req.body.title, body, privacy, "data");
  let editedStory;
  try {
    editedStory = await Story.findById(storyId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }
  if (editedStory.userId.toString() !== req.user._id.toString()) {
    const error = new HttpError("You are not allowed to edit this story.", 401);
    return next(error);
  }

  editedStory.title = title;
  editedStory.body = body;
  editedStory.privacy = privacy;
  // console.log(editedStory, "edited");
  try {
    await editedStory.save();
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update story.",
      500
    );
    return next(error);
  }
  res
    .status(200)
    .json({ editedStory: editedStory.toObject({ getters: true }) });
};

const deleteStrory = async (req, res, next) => {
  const storyId = req.params.sid;
  let story;
  try {
    story = await Story.findById(storyId).populate("userId");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete Story.",
      500
    );
    return next(error);
  }
  if (!story) {
    const error = new HttpError("Could not find Story for this id.", 404);
    return next(error);
  }

  if (story.userId._id.toString() !== req.user._id.toString()) {
    const error = new HttpError(
      "You are not allowed to delete this Story.",
      401
    );
    return next(error);
  }
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await story.deleteOne({ session: session });
    story.userId.stories.pull(story);
    await story.userId.save(session);
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete story.",
      500
    );
    return next(error);
  }
  res.status(200).json({ message: "deleted Story", storyId });
};

exports.getPublicStories = getPublicStories;
exports.postStory = postStory;
exports.editStory = editStory;
exports.deleteStrory = deleteStrory;
