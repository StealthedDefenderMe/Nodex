const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser')
const User = require('../models/User')
const About = require('../models/About')


// ROUTE 1: Fetching all User specific record-> 
router.get('/getrecords', fetchUser, async(req, res)=>{

    try {
        // Fetching user specific data...
        const record = await About.find({user: req.user.id})
        res.send({record})
    } catch (error) {
        res.status(400).json({ error: "Error fetching records", message: error.message });
    }

})

// ROUTE 2: Creating About record at -> /api/about/create (LOGIN REQUIRED)
router.post('/create', fetchUser, async(req, res)=>{
    try {

        // Fetching specific user.
        const user = await User.findById({_id: req.user.id})

        const aboutRecord = await About.create({
            user: req.user.id,
            author: user.name,
            title: req.body.title,
            description: req.body.description,
            services: req.body.services
        })

        res.json({aboutRecord})

    } catch (error) {
        res.status(400).json({ error: "Error creating about record", message: error.message });
    }
})

// ROUTE 4: Updating specific record at-> /api/about/update/:id (LOGIN REQUIRED)
router.put('/update/:id', fetchUser, async(req, res)=>{
    
    try {
        
        // Finding Record to be deleted...
        let existsRecord = await About.findById(req.params.id);

        // catching error if record doesn't exists
        if (!existsRecord) {
            return res.status(404).json({ error: "Note doesn't exist" });
          }
          
        // Checking if record belongs to that specific user  
        if (existsRecord.user.toString() !== req.user.id) {
           return res.status(401).json({ error: "Access denied" });
        }

        // If the record exists and belongs to the user, update it
        const { title, description, services } = req.body;

        // You can customize the update fields based on your requirements
        existsRecord.title = title || existsRecord.title;
        existsRecord.description = description || existsRecord.description;
        existsRecord.services = services || existsRecord.services;

        // Save the updated record
        await existsRecord.save();

        res.send('Record has been updated successfully')

    } catch (error) {
        
    }

})

router.post('/createOrUpdate/:id', fetchUser, async (req, res) => {
    try {
        let existsRecord;

        // If ID is provided, check if the record exists
        if (req.params.id) {
            existsRecord = await About.findById(req.params.id);

            // Catching error if the record doesn't exist
            if (!existsRecord) {
                return res.status(404).json({ error: "Record doesn't exist" });
            }

            // Checking if the record belongs to that specific user
            if (existsRecord.user.toString() !== req.user.id) {
                return res.status(401).json({ error: "Access denied" });
            }
        }

        // Fetching specific user.
        const user = await User.findById({ _id: req.user.id });

        // If the record exists, update it; if not, create a new record
        if (existsRecord) {
            const { title, description, services } = req.body;

            // You can customize the update fields based on your requirements
            existsRecord.title = title || existsRecord.title;
            existsRecord.description = description || existsRecord.description;
            existsRecord.services = services || existsRecord.services;

            // Save the updated record
            await existsRecord.save();
            res.send('Record has been updated successfully');
        } else {
            const aboutRecord = await About.create({
                user: req.user.id,
                author: user.name,
                title: req.body.title,
                description: req.body.description,
                services: req.body.services
            });

            res.json({ aboutRecord });
        }

    } catch (error) {
        res.status(400).json({ error: "Error creating/updating record", message: error.message });
    }
});





















// ROUTE 3: Deleting About record at -> /api/about/delete/:id (LOGIN REQUIRED)
router.delete('/delete/:id', fetchUser, async(req, res)=>{

    try {
        
        // Finding the note to be deleted..
        let record = await About.findById(req.params.id);

        // Catching the error if record doesn't exists..
        if (!record) {
            return res.status(404).json({ error: "Record to be deleted do not exists" });
        }

        // Allow deletion only if user own particular note
        if (record.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Access denied" });
        }

        //deleting the existng note..
        record = await About.findByIdAndDelete(req.params.id);

        res.send("Record has been deleted successfully")

    } catch (error) {
        res.status(400).json({ error: "Error deleting record", message: error.message });
    }

})

module.exports = router;