const express = require("express");
const router = express.Router();
const Projects = require("../../../models/projects");
const Image = require("../../../models/image");
const auth = require('../../helpers/auth')

router.post("/add-details", auth, async (req, res) => {
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
      image
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
      image
    });
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project added successfully", Project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/all-project",  async (req, res) => {
  try {
    const projects = await Projects.find({})
      .populate({
        path: "team",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
        },
      })
      .populate({
        path: "client.id",
      })
      .populate({
        path: "client.image",
      });

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/assigned-project/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const Images = await Image.find({});
    const projects = await Projects.find({})
      .populate({
        path: "team",
        select: "teamLeader teamMember projectName status createdAt",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
          select: "userName email  firstName lastName path",
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
    const filteredProjects = projects.filter((val) => {
      const isTeamLeader = val?.team?.teamLeader?.id?.equals(userId);
      const isTeamMember = val?.team?.teamMember?.some((elm) =>
        elm.id.equals(userId)
      );

      return isTeamLeader || isTeamMember;
    });
    const project = filteredProjects.map(async (val) => {
      const project_Id = val._id;
      const projectImg = Images.find((elm) => elm.user_Id.equals(project_Id));
      const projectImage = projectImg
        ? { path: projectImg.path, id: projectImg.id }
        : "";
      return { ...val._doc, projectImage };
    });

    const projectsList = await Promise.all(project);
    res.status(200).json(projectsList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/client-project/:id", auth, async (req, res) => {
  try {
    const clientId = req.params.id;
    const Images = await Image.find({});
    const projects = await Projects.find({ "client.id": clientId })
      .populate({
        path: "team",
        select: "teamLeader teamMember projectName status createdAt",
        populate: {
          path: "teamLeader.id teamMember.id teamLeader.image teamMember.image",
          select: "userName email  firstName lastName path",
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
    const project = projects.map(async (val) => {
      const project_Id = val._id;
      const projectImg = Images.find((elm) => elm.user_Id.equals(project_Id));
      const projectImage = projectImg
        ? { path: projectImg.path, id: projectImg.id }
        : "";
      return { ...val._doc, projectImage };
    });

    const projectsList = await Promise.all(project);
    res.status(200).json(projectsList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-project", auth, async (req, res) => {
  try {
    const projectId = req.body.id;
    const updatedFields = req.body;

    const updatedProject = await Projects.findOneAndUpdate(
      { _id: projectId },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Project detail updated successfully!", Project:updatedProject});
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
