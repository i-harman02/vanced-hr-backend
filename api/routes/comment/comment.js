const express = require("express");
const router = express.Router();
const Comment = require("../../../models/comment");
const Announcement = require("../../../models/announcement");
const auth = require('../../helpers/auth')

router.post("/post",auth, async (req, res) => {
  try {
    const { employee, text, id } = req.body;
    if (!employee || !text) {
      return res.status(400).json({ message: "Bad Request" });
    }
    const newComment = new Comment({
      employee,
      text,
    });
    await newComment.save();
    const populatedComment = await Comment.findById(newComment._id).populate("employee");
    
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $push: { comment: newComment._id } },
      { new: true }
    );
    if (!updatedAnnouncement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.status(201).json({ message: "Comment added successfully", newComment: populatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/delete-comment",auth, async (req, res) => {
  try {
    let id = req.body.postId;
    let commentId = req.body.commentId;
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        $pull: { comment: commentId },
      },
      { new: true }
    );
    let data = await Comment.deleteOne({ _id: commentId });
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/update-comment",auth, async (req, res) => {
  try {
    const commentId = req.body.id;
    const updatedFields = req.body;
    await Comment.findOneAndUpdate(
      { _id: commentId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send("comment updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/like-post",auth, async (req, res) => {
  try {

    // imageId and employeeId
    const { employee,  id } = req.body;
    if (!employee) {
      return res.status(400).json({ message: "Bad Request" });
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    const existingLike = announcement.likes.find((elm) =>
      elm.employee.equals(employee)
    );

    if (!existingLike) {
      await Announcement.findByIdAndUpdate(
        id,
        { $push: { likes: { employee } } },
        { new: true }
      );
      res.status(200).json({ message: "Like added" });
    } else {
      await Announcement.findByIdAndUpdate(
        id,
        { $pull: { likes: existingLike } },
        { new: true }
      );
      res.status(200).json({ message: "Like removed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
