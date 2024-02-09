const mongoose = require('mongoose')

const AboutSchema = new mongoose.Schema({

    user:{
        // Specifies that the field should store MongoDB ObjectId values. ObjectId is a 12-byte identifier typically assigned to documents in MongoDB collections. It works like foreign key..
        type: mongoose.Schema.Types.ObjectId,
        
        // This field points to documents in the 'User' collection, linking 'Profile' and 'User' data. When you retrieve info, Mongoose uses this link to get related 'User' data..
        ref: 'user'
    },

    author: {
        type: String,
        required: true,
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    services: [{
        type: String,
        required: true
    }]

}, {timestamps: true})

module.exports = mongoose.model('about', AboutSchema)