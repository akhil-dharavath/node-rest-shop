const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchUser = require("../middleware/fetchUser");

const jwt_secret = "someSecretKey";
// ROUTE 1 : create a user at api/auth/signUp. No login required
router.post(
  "/signUp",
  [
    body("name", "Enter a valid Name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "failed", error: errors.array() });
    }

    //checking for email if it already exists
    try {
      let finduser = await User.findOne({ email: req.body.email });
      if (finduser) {
        return res.status(400).json({
          message: "failed",
          error: "Sorry User with this email already exists",
        });
      }

      // hashing the password with bcryptjs
      const salt = await bcrypt.genSalt(10);
      const securedPassword = await bcrypt.hash(req.body.password, salt);
      let user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securedPassword,
      });
      //   preparing id for authToken
      const data = {
        user: {
          id: user.id,
        },
      };

      // creating auth-token with jsonwebtoken
      const authToken = jwt.sign(data, jwt_secret);
      res.json({ message: "success", authToken });
    } catch (err) {
      res.status(500).json({
        message: "failed",
        error: "Internal server Error",
        errorMessage: err.message,
      });
    }
  }
);

// ROUTE 2 : Authenticate a user at api/auth/login. No login required
router.post(
  "/login",
  [body("email", "Enter a valid Email").isEmail()],
  [body("password", "Password Cannot be blank").exists()],
  async (req, res) => {
    //validating entered email and password
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "failed", error: errors.array() });
    }

    const { email, password } = req.body;
    try {
      // find the user
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          message: "failed",
          error: "Please try to login with correct credentials",
        });
      }
      // compare user password and entered password
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({
          message: "failed",
          error: "Please try to login with correct credentials",
        });
      }
      //preparing id for authToken
      const data = {
        user: {
          id: user.id,
        },
      };
      // sigining authToken
      const authToken = jwt.sign(data, jwt_secret);
      res.json({ message: "success", authToken });
    } catch (err) {
      res.status(500).json({
        message: "failed",
        error: "Internal server Error",
        errorMessage: err.message,
      });
    }
  }
);

// ROUTE 3 : delete user details at api/auth/delete/:id. login required
router.delete("/deleteUser/:id", fetchUser, async (req, res) => {
  try {
    // find the User to be delete and delete it
    let findUser = await User.findById(req.params.id);
    if (!findUser) {
      return res
        .status(404)
        .json({ message: "failed", error: "Account Not Found" });
    }
    // Allow user if only note belongs to the same user
    if (findUser._id.toString() !== req.user.id) {
      return res.status(401).json({ message: "failed", error: "Not Allowed" });
    }
    findUser = await User.findByIdAndDelete(req.params.id);
    res.json({
      message: "Successfully account has been deleted",
      user: findUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "failed",
      error: "Internal server Error",
      errorMessage: err.message,
    });
  }
});

// // ROUTE 4 : get logged in user deatails at api/auth/getUser. login required
// router.post("/getUser",fetchUser, async (req, res) => {
//     try {
//         const id = req.user.id
//         const user = await User.findById(id).select('-password')
//         res.send({success:true,user})
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send({success:false,error:"Internal server Error"});
//     }
//   }
// );

module.exports = router;
