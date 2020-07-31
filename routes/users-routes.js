const express = require("express");
const { check } = require("express-validator");

const userController = require("../controllers/users-controllers");
const chekAuth = require("../middleware/checkAuth");
const fileUpload = require("../middleware/fileUpload");

const router = express.Router();

router.post("/login", userController.login);
router.post(
  "/signup",
  [
    check("userName").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userController.signup
);

router.use(chekAuth);

router.get("/:uid", userController.getUserProfile);
router.patch(
  "/:uid",
  [
    check("coverQuote").notEmpty(),
    check("location").notEmpty(),
    check("bio").notEmpty(),
  ],
  userController.editUserProfile
);
router.patch(
  "/images/:uid",
  fileUpload.single("image"),
  userController.imageUpload
);

module.exports = router;
