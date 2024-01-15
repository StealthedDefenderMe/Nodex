const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fetchUser = require('../middleware/fetchUser')



//ROUTE 1 : Establishing a create user endpoint using POST at - /api/auth/createuser
router.post(
  "/createuser",
  [
    //Catching and declaring the errors..
    body("name", "Your name should atleast 5 characters").isLength({ min: 5 }),
    body("email", "Invalid email address").isEmail(),
    body("contact", "This number is Invalid").isLength({ min: 10 }),
    body("password", "Your password should atleast 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Checking if user is already present in the database..
      let user = await User.findOne({ email: req.body.email });

      if (user) {
        return res.status(400).json({ error: "This email is already in use." });
      } else {

        //Generating salt..
        var salt = bcrypt.genSaltSync(10);  //used await because it return promise

        // Securing the password using bcrypt hashing..
        const secpass = await bcrypt.hash(req.body.password, salt) //used await because it return promise
        
        // Creating new user..
        user = await User.create({
          name: req.body.name,
          email: req.body.email,
          contact: req.body.contact,
          password: secpass
        });

        // Setting up the jwt token..
        const data = {user: {id: user._id}}
        const authtoken = jwt.sign(data, process.env.SECRET_KEY)

        res.json({authtoken})
      }
    } catch (error) {
      res.status(400).json({error: "Some error occurred", message: error.message})
    }
  }
);



//ROUTE 2 : Authentificating a user endpoint using POST at - /api/auth/login
router.post(
  "/login",
  [
    //Catching and declaring the errors..
    body("email", "Invalid email address").isEmail(),
    body("password", "Password cannot be blank").exists()
  ],
  async (req, res) => {
    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body

    try {
      //Checking if user exists in database..
      let user = await User.findOne({email})
      if(!user){
        return res.status(400).json({message: "Please enter your id or password correctly"})
      }

      //Checking passwords..
      const checkpas = await bcrypt.compare(password, user.password)
      if(!checkpas){
        return res.status(400).json({message: "Please enter your id or password correctly"})
      }

      // Sending payload for jwt..
      // Sending (_id) in auth token to verify at login required routes
      const data = {user: {id: user._id}}
      const authtoken = jwt.sign(data, process.env.SECRET_KEY)
      res.json({authtoken})

    } catch (error) {
      res.status(400).json({error: "Some error occurred", message: error.message})
    }
  }
);


//ROUTE 3 : Geting the details of logged in user using GET at - /api/auth/getuser (login required)

router.post("/getuser", fetchUser, async (req, res) => {

    try {

      let uid = req.user.id;
      const user = await User.findById(uid).select("-password")
      res.json({user})

    } catch (error) {
      res.status(400).json({error: "Some error occurred", message: error.message})
    }
});

module.exports = router;