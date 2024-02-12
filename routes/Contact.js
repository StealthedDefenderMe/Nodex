const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Contact = require("../models/Contact");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Set up multer for handling file uploads...
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "contactuploads/"); // specify the folder where you want to store the uploaded files
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
router.use(
  "/contactuploads",
  express.static(path.join(filepath, "contactuploads"))
);

//ROUTE 1 : Fetching all user specific data using GET at - /api/user/info  --> (LogIn required)
router.get("/getcontact", fetchUser, async (req, res) => {
  try {
    const response = await Contact.find({ user: req.user.id });
    // res.send(response);

    const updatedResponse = response.map((item) => {
      return {
        ...item._doc,
        imagePath: `http://localhost:8000/api/contactus/${item.filepath}`,
      };
    });

    res.send(updatedResponse);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error fetching details", message: error.message });
  }
});

// ROUTE 2 : Adding user specific data to database using POST at - /api/contactys/createcontact --> (LogIn required)
router.post(
  "/createcontact",
  fetchUser,
  upload.single("file"),
  [
    //Catching and declaring the errors..
    body("title", "Title should atleast 5 characters").isLength({ min: 5 }),
    body("aboutDesc", "Title should atleast 10 characters").isLength({
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
    const filePath = `contactuploads/${req.file.filename}`;

    // Check if a contact record already exists for the user
    const existingContact = await Contact.findOne({ user: req.user.id });
    if (existingContact) {
      return res
        .status(400)
        .json({ error: "Contact record already exists for this user" });
    }

    // Creating a new note for specific user..
    try {
      // Fetching specific user here..
      const user = await User.findOne({ _id: req.user.id });

      const record = await Contact.create({
        user: req.user.id,
        author: user.name,
        title: req.body.title,
        aboutDesc: req.body.aboutDesc,
        address: req.body.address,
        email: req.body.email,
        copyright: req.body.copyright,
        author: user.name,
        filepath: filePath,
      });

      res.send(record);
    } catch (error) {
      res
        .status(400)
        .json({ error: "Error creating contact", message: error.message });
    }
  }
);

//ROUTE 3 : Updating user specific data to database using PUT at - /api/user/updaterecord --> (LogIn required)
router.put(
  "/updatecontact/:id",
  fetchUser,
  upload.single("file"),
  [
    body("title", "Title should be at least 5 characters").isLength({ min: 5 }),
    body("aboutDesc", "Content should be at least 100 characters").isLength({
      min: 100,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, aboutDesc, email, address, copyright } = req.body;
    const updateData = {};

    if (title) {
      updateData.title = title;
    }
    if (aboutDesc) {
      updateData.aboutDesc = aboutDesc;
    }
    if (address) {
      updateData.address = address;
    }
    if (email) {
      updateData.email = email;
    }
    if (copyright) {
      updateData.copyright = copyright;
    }

    try {
      let existingBlog = await Contact.findById(req.params.id);

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
          updateData.filepath = path.join("contactuploads", req.file.filename);
        }
      }

      // Update the existing note in the database...
      existingBlog = await Contact.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      res.json({ existingBlog });
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/managecontact",
  fetchUser,
  upload.single("file"),
  [
    body("title", "Title should at least be 5 characters").isLength({ min: 5 }),
    body("aboutDesc", "Content should at least be 100 characters").isLength({
      min: 100,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, aboutDesc, email, address, copyright } = req.body;
    const filePath = req.file ? `contactuploads/${req.file.filename}` : null;

    try {
      const existingContact = await Contact.findOne();
      // If initial settings already exist, return an error
      if (existingContact) {
        const updateData = {
          title: title || existingContact.title,
          aboutDesc: aboutDesc || existingContact.aboutDesc,
          address: address || existingContact.address,
          email: email || existingContact.email,
          copyright: copyright || existingContact.copyright,
          filepath: filePath || existingContact.filepath,
        };

        // Update the file path if a new file is uploaded...
        if (req.file) {
          console.log(req.file, "....................");
          // Remove the old file, if it exists...
          if (existingContact.filepath) {
            const oldFilePath = path.join(existingContact.filepath);
            if (fs.existsSync(oldFilePath)) {
              await fs.promises.unlink(oldFilePath);
            }
          }
        }
        Object.assign(existingContact, updateData);
        await existingContact.save();

        // existingContact = await Contact.findOneAndUpdate(
        //   { user: req.user.id },
        //   { $set: updateData },
        //   { new: true }
        // );

        res.json({
          existingContact,
          message: "Contact record updated successfully",
        });
      } else {
        const newContact = await Contact.create({
          title,
          aboutDesc,
          address,
          email,
          copyright,
          filepath: filePath,
        });

        res.json({
          newContact,
          message: "Contact record created successfully",
        });
      }

      // ---------- Prathamesh  Code -------------
      // let existingContact = await Contact.findOne({ user: req.user.id });

      // if (existingContact) {
      //   // Update the existing contact in the database...
      //   const updateData = {
      //     title: title || existingContact.title,
      //     aboutDesc: aboutDesc || existingContact.aboutDesc,
      //     address: address || existingContact.address,
      //     email: email || existingContact.email,
      //     copyright: copyright || existingContact.copyright,
      //     filepath: filePath || existingContact.filepath,
      //   };

      //   // Update the file path if a new file is uploaded...
      //   if (req.file) {
      //     // Remove the old file, if it exists...
      //     if (existingContact.filepath) {
      //       const oldFilePath = path.join(existingContact.filepath);
      //       if (fs.existsSync(oldFilePath)) {
      //         await fs.promises.unlink(oldFilePath);
      //       }
      //     }
      //   }

      //   existingContact = await Contact.findOneAndUpdate(
      //     { user: req.user.id },
      //     { $set: updateData },
      //     { new: true }
      //   );

      //   res.json({ existingContact, message: "Contact record updated successfully" });
      // } else {
      //   // Create a new contact record for the user...
      //   const user = await User.findOne({ _id: req.user.id });

      //   const newContact = await Contact.create({
      //     user: req.user.id,
      //     author: user.name,
      //     title,
      //     aboutDesc,
      //     address,
      //     email,
      //     copyright,
      //     filepath: filePath,
      //   });

      //   res.json({ newContact, message: "Contact record created successfully" });
      // }
    } catch (error) {
      console.error("Error managing contact:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// ROUTE 3: Deleting About record at -> /api/about/delete/:id (LOGIN REQUIRED)
router.delete("/deletecontact/:id", fetchUser, async (req, res) => {
  // Get the current directory of the script
  const currentDirectory = __dirname;

  // Set the desired directory path relative to the current directory
  const targetDirectory = path.resolve(currentDirectory, "..");

  // Finding the note to be deleted..
  let userdata = await Contact.findById(req.params.id);

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
  userdata = await Contact.findByIdAndDelete(req.params.id);

  // Deleting the associated file
  const filePath = userdata.filepath;
  if (filePath) {
    const absoluteFilePath = path.join(targetDirectory, filePath);
    fs.unlinkSync(absoluteFilePath);
  }

  res.send("Record has been deleted successfully");
});

module.exports = router;
