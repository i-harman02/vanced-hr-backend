const express = require("express");
const router = express.Router();
const Client = require("../../../models/client");
const Image = require("../../../models/image");

router.post("/add-client", async (req, res) => {
  try {
    const {
      userName,
      mail,
      organization,
      status,
      address,
      aboutUs,
      company,
      socialMedia,
      contactNumber,
      firstName,
      lastName,
    } = req.body;
    const existingEmail = await Client.findOne({ mail });
    if (existingEmail) {
      return res.status(409).json({ message: "mail already exists" });
    }
    const newClient = new Client({
      userName,
      mail,
      organization,
      status,
      address,
      aboutUs,
      company,
      socialMedia,
      contactNumber,
      firstName,
      lastName,
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

router.get("/detail", async (req, res) => {
  try {
    const usersImg = await Image.find({});
    const client = await Client.find({});
    const clientDetail = client.map(async (val, idx) => {
      const user_Id = val._id;
      const clientImg = usersImg.find((elm) => elm.user_Id.equals(user_Id));
      const image = clientImg ? { path: clientImg.path, id: clientImg.id } : "";
      return { ...val._doc, image };
    });
    const clientDetails = await Promise.all(clientDetail);
    res.status(200).json(clientDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/detail-update", async (req, res) => {
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
router.delete("/delete/:id", async (req, res) => {
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
