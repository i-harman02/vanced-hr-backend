const express = require("express");
const router = express.Router();
const Projects = require("../../../models/projects");
const Image = require("../../../models/image");

router.post("/add-details", async (req, res) => {
  try {
    const {
      team,
      client,
      projectName,
      projectDescription,
      startDate,
      endDate,
      rate,
      priority,
      currentStatus,
    } = req.body;

    const newProject = new Projects({
      team,
      client,
      projectName,
      projectDescription,
      startDate,
      endDate,
      rate,
      priority,
      currentStatus,
    });
    await newProject.save();
    res.status(201).json({ message: "Project added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/all-project", async (req, res) => {
  try {
    const projects = await Projects.find({})
      .populate({
        path: "team",
        select: "teamLeader teamMember projectName status createdAt",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
          select: "userName mail  firstName lastName path",
        },
      })
      .populate({
        path: "client.id",
        select: "userName mail organization firstName lastName",
      })
      .populate({
        path: "client.image",
        select: "path",
      });

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/assigned-project/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const projects = await Projects.find({})
      .populate({
        path: "team",
        select: "teamLeader teamMember projectName status createdAt",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
          select: "userName mail  firstName lastName path",
        },
      })
      .populate({
        path: "client.id",
        select: "userName mail organization firstName lastName",
      })
      .populate({
        path: "client.image",
        select: "path",
      });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/client-project/:id", async (req, res) => {
  try {
    const clientId = req.params.id;
    const projects = await Projects.find({ "client.id": clientId })
      .populate({
        path: "team",
        select: "teamLeader teamMember projectName status createdAt",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
          select: "userName mail  firstName lastName path",
        },
      })
      .populate({
        path: "client.id",
        select: "userName mail organization firstName lastName",
      })
      .populate({
        path: "client.image",
        select: "path",
      });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-project", async (req, res) => {
  try {
    const projectId = req.body.id;
    const updatedFields = req.body;

    await Projects.findOneAndUpdate(
      { _id: projectId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send("Project detail updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
