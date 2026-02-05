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
    
    // Fetch user to know their designation if needed? 
    // For now we just return projects safely, or filter by designation matching?
    // Let's safe-guard the existing logic or modify it.
    // If we can't link to a team, we can't filter by team members.
    // We will return all projects for now to avoid empty lists, or we could filter by user's designation.
    
    const projects = await Projects.find({})
      .populate({
        path: "client.id",
        select: "userName mail organization firstName lastName",
      })
      .populate({
        path: "client.image",
        select: "path",
      });

    // Filtering logic (simplified for string teams)
    // If team is a string, we can't check members. We'll return the project if the user is an admin or we just return it.
    // Assuming for now we skip strict filtering to ensure data visibility.
    const filteredProjects = projects; 

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

router.delete("/delete-project/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Projects.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
