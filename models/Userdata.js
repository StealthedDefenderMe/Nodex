const mongoose = require("mongoose")

const UserdataSchema = new mongoose.Schema({

    user:{
        // Specifies that the field should store MongoDB ObjectId values. ObjectId is a 12-byte identifier typically assigned to documents in MongoDB collections. It works like foreign key..
        type: mongoose.Schema.Types.ObjectId,
        
        // This field points to documents in the 'User' collection, linking 'Profile' and 'User' data. When you retrieve info, Mongoose uses this link to get related 'User' data..
        ref: 'user'
    },

      title: {
        type: String,
        required: true,
      },

      content: {
        type: String,
        required: true,
      },
      
      author: {
        type: String,
        required: true,
      },

      categories: {
        type: [String],
        enum: ['Web Development', 'Software', 'Programming', 'Healthcare', 'Travel', 'History', 'Geo-Politics', 'Other'],
        required: true
      },

      filepath:{
        type: String,
        required: true
      },
      
      date: {
        type: Date,
        default: Date.now,
      },
})

module.exports = mongoose.model('userdata', UserdataSchema)