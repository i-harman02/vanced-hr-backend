const express = require("express");
const router = express.Router();
const Announcement = require("../../../models/announcement");
const Image = require("../../../models/image");
const Comment = require("../../../models/comment");
const removeImage = require("../../helpers/deleteImage/deleteImage");
const auth = require('../../helpers/auth')

router.post("/add", auth, async (req, res) => {
  try {
    const { employee, title, description, image } = req.body;

    const newAnnouncement = new Announcement({
      employee,
      image,
      description,
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

router.get("/list", auth, async (req, res) => {
  try {
    const usersImg = await Image.find({});
    const announcement = await Announcement.find({})
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
    const announcementId = req.body.id;
    const updatedFields = req.body;
    await Announcement.findOneAndUpdate(
      { _id: announcementId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send("announcement updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
