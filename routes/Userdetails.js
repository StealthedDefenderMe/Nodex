const express = require('express')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser')
const Userdata = require('../models/Userdata')
const { body, validationResult } = require("express-validator");


//ROUTE 1 : Fetching all user specific data using GET at - /api/user/info  --> (LogIn required)
router.get("/info", fetchUser, async(req, res)=>{

    try {
        const response = await Userdata.find({user : req.user.id})
        res.send(response)
    } catch (error) {
        res.status(400).json({error: "Error fetching details", message: error.message})
    }
})




//ROUTE 2 : Adding user specific data to database using POST at - /api/user/record --> (LogIn required)
router.post("/record", fetchUser, [

    //Catching and declaring the errors..
    body("name", "Enter you full name").isLength({ min: 5 }),
    body("contact", "This number is Invalid").isLength({ min: 10 }),
    body("stack", "Enter your skils").isLength({ min: 3}),
    body("linkedlink", "Please provide your linkedIn link").isURL()

], async(req, res)=>{

    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Creating a new note for specific user..
    try {
        
        const record = await Userdata.create({
            user: req.user.id,
            name: req.body.name,
            contact: req.body.contact,
            stack: req.body.stack,
            workexperience: req.body.workexperience,
            linkedlink: req.body.linkedlink
        })

        res.json(record)

    } catch (error) {
        res.status(400).json({error: "Error creating user", message: error.message})
    }
})




//ROUTE 3 : Updating user specific data to database using PUT at - /api/user/updaterecord --> (LogIn required)
router.put("/updaterecord/:id", fetchUser, [

    //Catching and declaring the errors..
    body("name", "Enter you full name").isLength({ min: 5 }),
    body("contact", "This number is Invalid").isLength({ min: 10 }),
    body("stack", "Enter your skils").isLength({ min: 3}),
    body("linkedlink", "Please provide your linkedIn link").isURL()

], async(req, res)=>{

    //Fetching the errors in array if there is any..
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const {name, contact, stack, workexperience, linkedlink} = req.body;

    // Creating new object..
    const newRecord = {}

    // Checking if the data is present in the fields..
    if(name){newRecord.name = name}
    if(contact){newRecord.contact = contact}
    if(stack){newRecord.stack = stack}
    if(workexperience){newRecord.workexperience = workexperience}
    if(linkedlink){newRecord.linkedlink = linkedlink}

    // Finding the note to be updated..
    let userdata = await Userdata.findById(req.params.id)

    // Catching the error if note doesn't exists..
    if(!userdata){ return res.status(404).json({ error : "Note doesn't exists"})}

    // Checkign if data belong to specific user..
    if(userdata.user.toString() !== req.user.id){ return res.status(401).json({ error : "Access denied"}) }

    //Updating the existng note..
    userdata = await Userdata.findByIdAndUpdate(req.params.id, {$set : newRecord}, {new : true})

    res.json({userdata})
});




//ROUTE 4 : Deleting user specific data to database using DELETE at - /api/user/deleterecord --> (LogIn required)
router.delete("/deleterecord/:id", fetchUser, async(req, res)=>{

    // Finding the note to be deleted..
    let userdata = await Userdata.findById(req.params.id)

    // Catching the error if record doesn't exists..
    if(!userdata){ return res.status(404).json({ error : "Record to be deleted do not exists"})}

    // Allow deletion only if user own particular note
    if(userdata.user.toString() !== req.user.id){ return res.status(401).json({ error : "Access denied"}) }

    //deleting the existng note..
    userdata = await Userdata.findByIdAndDelete(req.params.id)

    res.send("Record has been deleted successfully")
});

module.exports = router;