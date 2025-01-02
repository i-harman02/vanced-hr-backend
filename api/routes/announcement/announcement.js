const express = require("express");
const router = express.Router();
const Announcement = require("../../../models/announcement");
const Image = require("../../../models/image");
const Comment = require("../../../models/comment");
const removeImage = require("../../helpers/deleteImage/deleteImage");
const auth = require('../../helpers/auth')

router.post("/add",auth, async (req, res) => {
  try {
    const { employee, title, description } = req.body;
  
   const profile = await Image.findOne({ user_Id: employee });
    const profileId = profile ? profile._id : null; 
  
    const newAnnouncement = new Announcement({
      employee,
      image: profileId, 
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

router.get("/list",auth, async (req, res) => {
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
  
    const announcementDetail = announcement.map(async (val) => {
      const updatedComments = val.comment.map((comment) => {
        if (comment.employee) {
          const clientImg = usersImg.find((img) => img.user_Id.equals(comment.employee._id));
          return {
            ...comment._doc,
            employee: {
              ...comment.employee._doc, // Spread employee fields
              image: clientImg ? clientImg.path : null, // Add the image field
            },
          };
        }
        return comment;
      });
  
      const user_Id = val._id;
      const clientImg = usersImg.find((elm) => elm.user_Id.equals(user_Id));
      const announcementImage = clientImg ? clientImg.path : null;
  
      return { ...val._doc, announcementImage, comment: updatedComments };
    });
  
    const announcements = await Promise.all(announcementDetail);
    res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
  
});

router.delete("/delete/:id",auth, async (req, res) => {
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
router.put("/update-announcement",auth, async (req, res) => {
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
