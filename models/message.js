const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    parentMessageId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null,
    },

    senderId: String,
    receiverId: String,
    senderName: String,
    senderEmail: String,
    receiverName: String,
    receiverEmail: String,
    isGroup: { type: Boolean, default: false },
    subject: String,
    body: String,
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isReplied: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
