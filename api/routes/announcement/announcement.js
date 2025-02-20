const express = require("express");
const router = express.Router();
const Announcement = require("../../../models/announcement");
const Image = require("../../../models/image");
const Comment = require("../../../models/comment");
const removeImage = require("../../helpers/deleteImage/deleteImage");
const auth = require('../../helpers/auth')

router.post("/add", auth, async (req, res) => {
  try {
    const { employee, title, description, image, postType } = req.body;

    const newAnnouncement = new Announcement({
      employee,
      image,
      description,
      postType
    });

    await newAnnouncement.save();
    res.status(201).json({
      message: "Post added successfully",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }

});

router.get("/list/:postType", auth, async (req, res) => {
  try {
    let { postType } = req.params;
    postType = Number(postType);
    if (isNaN(postType)) {
      return res.status(400).json({ message: "Invalid postType value" });
    }
  
    const announcement = await Announcement.find({ postType })
    .sort({ date: -1 })
      .populate({
        path: "employee",
      })
      .populate({
        path: "likes.employee",
      })
      .populate({
        path: "comment",
        populate: {
          path: "employee",
        },
        select: "text date",
      });
  
    res.status(200).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
  

});

router.delete("/delete/:id", auth, async (req, res) => {
  try {
    let { id } = req.params;
    const announcement = await Announcement.findOne({ _id: id });
    const commentIds = announcement.comment;
    if (commentIds.length > 0) {
      await Comment.deleteMany({ _id: { $in: commentIds } });
    }
    await Announcement.deleteOne({ _id: id });
    await removeImage(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.put("/update-announcement", auth, async (req, res) => {
  try {
    const { announcementId, ...updatedFields } = req.body;

    if (!announcementId) {
      return res.status(400).json({ message: "Announcement ID is required" });
    }

    const announcementRes = await Announcement.findOneAndUpdate(
      { _id: announcementId },
      { $set: updatedFields },
      { new: true, upsert: false } // upsert false to avoid creating a new document if not found
    );

    if (!announcementRes) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json({
      message: "Announcement updated successfully!",
      data: announcementRes,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


module.exports = router;
