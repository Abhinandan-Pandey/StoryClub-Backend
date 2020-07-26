const express = require("express");
const { check } = require("express-validator");

const userController = require("../controllers/users-controllers");
const chekAuth = require("../middleware/checkAuth");
const fileUpload = require("../middleware/fileUpload");

const router = express.Router();

// router.use(chekAuth);

router.post("/login", userController.login);
router.post(
  "/signup",
  [
    check("UserName").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userController.signup
);
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
// router.patch('/imagesURL',userController);

module.exports = router;
