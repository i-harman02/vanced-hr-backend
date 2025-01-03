const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  image: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
      image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
      },
    },
  ],
 comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
    },
  ],
});

const Announcement = mongoose.model("Announcement", announcementSchema);

module.exports = Announcement;
