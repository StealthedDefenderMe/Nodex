const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  author: {
    type: String
  },
  title: {
    type: String,
    required: true,
  },
  aboutDesc: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  copyright: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ContactUs', ContactSchema);
