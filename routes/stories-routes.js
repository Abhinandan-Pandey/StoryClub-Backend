const express = require("express");
const { check } = require("express-validator");

const storyController = require("../controllers/stories-controller");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

// router.use(checkAuth);

router.get("/", storyController.getPublicStories);
router.post(
  "/",
  [check("title").trim().notEmpty(), check("body").trim().isLength({ min: 6 })],
  storyController.postStory
);
router.patch(
  "/:sid",
  [check("title").not().isEmpty(), check("body").isLength({ min: 6 })],
  storyController.editStory
);
router.delete("/:sid", storyController.deleteStrory);

module.exports = router;
