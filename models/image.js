const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  user_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Assuming you reference a User model here
    required: true,
  },
  path: {
    type: String, // Path to the image file
    required: true,
  },
  // You can add other fields as needed
});

const Image = mongoose.model('Image', imageSchema);


module.exports = Image;
