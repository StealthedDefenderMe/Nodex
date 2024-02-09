const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Userdata = require("../models/Userdata");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const fs = require('fs');
const path = require('path');

const multer = require('multer');

// Set up multer for handling file uploads...
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // specify the folder where you want to store the uploaded files
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });


// Assuming your images are stored in a folder named "images"
const filepath = path.join(__dirname, "..");

// Serve static files from the 'uploads' directory
router.use('/uploads', express.static(path.join(filepath, 'uploads')));

//ROUTE 1 : Fetching all user specific data using GET at - /api/user/info  --> (LogIn required)
router.get("/info", fetchUser, async (req, res) => {
  try {

    const response = await Userdata.find({ user: req.user.id });
    // res.send(response);

    const updatedResponse = response.map(item => {
      return {
        ...item._doc,
        imagePath: `http://localhost:8000/api/user//${item.filepath}`
      };
    });

    res.send(updatedResponse)

  } catch (error) {
    res
      .status(400)
      .json({ error: "Error fetching details", message: error.message });
  }
});

//ROUTE 2 : Adding user specific data to database using POST at - /api/user/record --> (LogIn required)
router.post(
  "/record",
  fetchUser,
  upload.single('file'),
  [
    //Catching and declaring the errors..
    body("title", "Title should atleast 5 characters").isLength({ min: 5 }),
    body("content", "Title should atleast 100 characters").isLength({
      min: 100,
    }),
    body("categories", "choose one category").exists(),
  ],
  async (req, res) => {
    
    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handling the uploaded file...
    const filePath = `uploads/${req.file.filename}`

    // Creating a new note for specific user..
    try {
      
      // Fetching specific user here..
      const user = await User.findOne({ _id: req.user.id });

      const record = await Userdata.create({
          user: req.user.id,
          title: req.body.title,
          content: req.body.content,
          author: user.name,
          categories: req.body.categories,
          filepath: filePath
      })

      res.json(record);
    } catch (error) {
      res
        .status(400)
        .json({ error: "Error creating user", message: error.message });
    }
  }
);







//ROUTE 3 : Updating user specific data to database using PUT at - /api/user/updaterecord --> (LogIn required)
router.put(
  "/updaterecord/:id",
  fetchUser,
  upload.single('file'),
  [
    body("title", "Title should be at least 5 characters").isLength({ min: 5 }),
    body("content", "Content should be at least 100 characters").isLength({ min: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;
    const updateData = {};

    if (title) {
      updateData.title = title;
    }
    if (content) {
      updateData.content = content;
    }

    try {
      let existingBlog = await Userdata.findById(req.params.id);

      if (!existingBlog) {
        return res.status(404).json({ error: "Note doesn't exist" });
      }

      if (existingBlog.user.toString() !== req.user.id) {
        return res.status(401).json({ error: "Access denied" });
      }

      // Update the file path if a new file is uploaded...
      if (req.file) {
        // Remove the old file, if it exists...
        if (existingBlog.filepath) {
          const oldFilePath = path.join(existingBlog.filepath);
          // console.log(oldFilePath);

          // Check if the old file exists before attempting to delete...
          if (fs.existsSync(oldFilePath)) {
            await fs.promises.unlink(oldFilePath);
            // console.log('Old file deleted:', existingBlog.filepath);
          } else {
            // console.log('Old file does not exist:', existingBlog.filepath);
          }

          // Update the file path to the new file...
          updateData.filepath = path.join('uploads', req.file.filename);
        }
      }

      // Update the existing note in the database...
      existingBlog = await Userdata.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      res.json({ existingBlog });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);














//ROUTE 4 : Deleting user specific data to database using DELETE at - /api/user/deleterecord --> (LogIn required)
router.delete("/deleterecord/:id", fetchUser, async (req, res) => {

  // Get the current directory of the script
  const currentDirectory = __dirname;

  // Set the desired directory path relative to the current directory
  const targetDirectory = path.resolve(currentDirectory, '..');

  // Finding the note to be deleted..
  let userdata = await Userdata.findById(req.params.id);

  // Catching the error if record doesn't exists..
  if (!userdata) {
    return res
      .status(404)
      .json({ error: "Record to be deleted do not exists" });
  }

  // Allow deletion only if user own particular note
  if (userdata.user.toString() !== req.user.id) {
    return res.status(401).json({ error: "Access denied" });
  }

  //deleting the existng note..
  userdata = await Userdata.findByIdAndDelete(req.params.id);

  // Deleting the associated file
  const filePath = userdata.filepath;
    if (filePath) {
      const absoluteFilePath = path.join(targetDirectory, filePath);
      fs.unlinkSync(absoluteFilePath);
    }

  res.send("Record has been deleted successfully");
});

module.exports = router;
