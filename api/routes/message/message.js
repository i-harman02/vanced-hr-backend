const express = require("express");
const Message = require("../../../models/message");
const Employee = require("../../../models/employee");
const auth = require("../../helpers/auth");

module.exports = (io) => {
  const router = express.Router();

 
  router.post("/send", auth, async (req, res) => {
    try {
      const { receiverId, groupId, subject, body, isGroup = false , parentMessageId } = req.body;

      if (!isGroup && (!receiverId || !subject)) {
        return res.status(400).json({ message: "Missing fields" });
      }

      // Fetch sender and receiver details from DB
      const [sender, receiver] = await Promise.all([
        Employee.findById(req.user.id),
        (!isGroup && receiverId) ? Employee.findById(receiverId) : null
      ]);
      
      const message = await Message.create({
        senderId: req.user.id,
        receiverId: isGroup ? (groupId || "GROUP_ALL") : receiverId,
        senderName: `${sender?.name || ""} ${sender?.lastName || ""}`.trim() || "User",
        senderEmail: sender?.email || "",
        receiverName: isGroup ? (groupId || "Everyone") : `${receiver?.name || ""} ${receiver?.lastName || ""}`.trim(),
        receiverEmail: isGroup ? "group@vanced" : receiver?.email || "",
        isGroup,
        subject: isGroup ? `Group: ${groupId || "Everyone"}` : subject,
        body,
      });
if (parentMessageId) {
  await Message.findByIdAndUpdate(parentMessageId, {
    isReplied: true,
  });
}

      if (isGroup) {
        const targetRoom = groupId || "GROUP_ALL";
        io.to(targetRoom).emit("newMail", message); // Emit only to relevant group room
      } else {
        io.to(receiverId).emit("newMail", message);
      }

      res.status(201).json(message);
    } catch (err) {
      console.error("❌ SEND ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ MESSAGES (INBOX/SENT/GROUP)
  router.get("/inbox", auth, async (req, res) => {
    try {
      const { box = "inbox", groupId } = req.query;
      let query = {};
      
      if (box === "sent") {
        query = { senderId: req.user.id, isGroup: false };
      } else if (box === "group") {
        query = { isGroup: true };
        if (groupId) {
          query.receiverId = groupId;
        }
      } else if (box === "all") {
        query = { 
          $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
          isGroup: false 
        };
      } else {
        query = { receiverId: req.user.id, isGroup: false };
      }

      const mails = await Message.find(query).sort({ createdAt: -1 }).limit(100);
      res.json(mails);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ DELETE
  router.delete("/delete/:id", auth, async (req, res) => {
    try {
      const message = await Message.findById(req.params.id);
      if (!message) return res.status(404).json({ message: "Message not found" });

      // Only sender or receiver can delete
      if (message.senderId !== req.user.id && message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
      }

      await Message.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
