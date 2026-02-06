const express = require("express");
const Message = require("../../../models/message");
const auth = require("../../helpers/auth");

module.exports = (io) => {
  const router = express.Router();

  // ✅ SEND MESSAGE
  router.post("/send", auth, async (req, res) => {
    try {
      const { receiverId, subject, body } = req.body;

      if (!receiverId || !subject || !body) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const message = await Message.create({
        senderId: req.user.userId,   // ✅ FIXED
        receiverId,
        subject,
        body,
        senderName: req.user.name || "User",
        senderEmail: req.user.email || ""
      });

      io.to(receiverId).emit("newMail", message);

      res.status(201).json(message);
    } catch (err) {
      console.error("❌ SEND ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ INBOX
  router.get("/inbox", auth, async (req, res) => {
    try {
      const mails = await Message.find({
        receiverId: req.user.userId   // ✅ FIXED
      }).sort({ createdAt: -1 });

      res.json(mails);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ READ
  router.patch("/read/:id", auth, async (req, res) => {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  });

  return router;
};
