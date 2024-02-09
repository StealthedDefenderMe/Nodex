const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Service = require("../models/Services")
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const fs = require('fs');
const path = require('path');

const multer = require('multer');

// Set up multer for handling file uploads...
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'serviceuploads/'); // specify the folder where you want to store the uploaded files
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
router.use('/serviceuploads', express.static(path.join(filepath, 'serviceuploads')));

//ROUTE 1 : Fetching all user specific data using GET at - /api/user/info  --> (LogIn required)
router.get("/getservice", fetchUser, async (req, res) => {
  try {

    const response = await Service.find({ user: req.user.id });
    // res.send(response);

    const updatedResponse = response.map(item => {
      return {
        ...item._doc,
        imagePath: `http://localhost:8000/api/services//${item.filepath}`
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
router.post("/createservice", fetchUser,
  upload.single('file'),
  [
    //Catching and declaring the errors..
    body("title", "Title should atleast 5 characters").isLength({ min: 5 }),
    body("description", "Title should atleast 10 characters").isLength({
      min: 100,
    }),
  ],
  async (req, res) => {
    
    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handling the uploaded file...
    const filePath = `serviceuploads/${req.file.filename}`

    // Creating a new note for specific user..
    try {
      
      // Fetching specific user here..
      const user = await User.findOne({ _id: req.user.id });

      const record = await Service.create({
          user: req.user.id,
          title: req.body.title,
          description: req.body.description,
          author: user.name,
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
  "/updateservice/:id",
  fetchUser,
  upload.single('file'),
  [
    body("title", "Title should be at least 5 characters").isLength({ min: 5 }),
    body("description", "description should be at least 100 characters").isLength({ min: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const updateData = {};

    if (title) {
      updateData.title = title;
    }
    if (description) {
      updateData.description = description;
    }

    try {
      let existingService = await Service.findById(req.params.id);

      if (!existingService) {
        return res.status(404).json({ error: "Note doesn't exist" });
      }

      if (existingService.user.toString() !== req.user.id) {
        return res.status(401).json({ error: "Access denied" });
      }

      // Update the file path if a new file is uploaded...
      if (req.file) {
        // Remove the old file, if it exists...
        if (existingService.filepath) {
          const oldFilePath = path.join(existingService.filepath);
          // console.log(oldFilePath);

          // Check if the old file exists before attempting to delete...
          if (fs.existsSync(oldFilePath)) {
            await fs.promises.unlink(oldFilePath);
            console.log('Old file deleted:', existingService.filepath);
          } else {
            console.log('Old file does not exist:', existingService.filepath);
          }

          // Update the file path to the new file...
          updateData.filepath = path.join('serviceuploads', req.file.filename);
        }
      }

      // Update the existing note in the database...
      existingService = await Service.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      res.json({ existingService });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
















//ROUTE 4 : Deleting user specific data to database using DELETE at - /api/user/deleterecord --> (LogIn required)
router.delete("/deleteservice/:id", fetchUser, async (req, res) => {

  // Get the current directory of the script
  const currentDirectory = __dirname;

  // Set the desired directory path relative to the current directory
  const targetDirectory = path.resolve(currentDirectory, '..');

  // Finding the note to be deleted..
  let service = await Service.findById(req.params.id);

  // Catching the error if record doesn't exists..
  if (!service) {
    return res
      .status(404)
      .json({ error: "Record to be deleted do not exists" });
  }

  // Allow deletion only if user own particular note
  if (service.user.toString() !== req.user.id) {
    return res.status(401).json({ error: "Access denied" });
  }

  //deleting the existng note..
  service = await Service.findByIdAndDelete(req.params.id);

  // Deleting the associated file
  const filePath = service.filepath;
    if (filePath) {
      const absoluteFilePath = path.join(targetDirectory, filePath);
      fs.unlinkSync(absoluteFilePath);
    }

  res.send("Record has been deleted successfully");
});

module.exports = router;
