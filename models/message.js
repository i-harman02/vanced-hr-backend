const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    senderName: String,
    senderEmail: String,
    subject: String,
    body: String,
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isReplied: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
