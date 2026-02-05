const express = require("express");
const router = express.Router();
const Client = require("../../../models/client");
const Image = require("../../../models/image");
const removeImage = require("../../helpers/deleteImage/deleteImage");
const auth = require('../../helpers/auth')

router.post("/add-client", async (req, res) => {
  try {
    const {
      clientName,
      mail,
      contactNumber,
      nationality,
      clientStatus
    } = req.body;
    
    const existingEmail = await Client.findOne({ mail });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
    
    const newClient = new Client({
      clientName,
      mail,
      contactNumber,
      nationality: nationality || "",
      clientStatus: clientStatus || "Active"
    });
    
    await newClient.save();
    res
      .status(201)
      .json({ message: "Client registered successfully", client: newClient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const Projects = require("../../../models/projects");

router.get("/detail",auth, async (req, res) => {
  try {
    const clients = await Client.find({}).lean(); // Use lean() to get plain JS objects
    
    // Fetch project counts for all clients
    const clientsWithCount = await Promise.all(clients.map(async (client) => {
      const projectCount = await Projects.countDocuments({ "client.id": client._id });
      return { ...client, projectCount };
    }));

    res.status(200).json(clientsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}); 

router.put("/detail-update",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Client.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Client detail updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.delete("/delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Client.deleteOne({ _id: id });
    await removeImage(id);
    res.status(200).send({ message: "Client deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
