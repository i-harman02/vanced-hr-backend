const express = require("express");
const router = express.Router();
const Team = require("../../../models/team");
const auth = require('../../helpers/auth')

router.post("/create-team",auth, async (req, res) => {
  try {
    const { teamLeader, teamMember, status, teamName } = req.body;
    const newTeam = new Team({ teamLeader, teamMember, status, teamName });
    await newTeam.save();
    res.status(201).json({ message: "Team created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.get("/my-team/:id",auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const teams = await Team.find({
      $or: [{ "teamLeader.id": userId }, { "teamMember.id": userId }],
    })
      .populate({
        path: "teamLeader.id",
        select:
          "userName designation employeeId firstName lastName email personalInformation.telephones",
      })
      .populate({
        path: "teamLeader.image",
        select: "path",
      })
      .populate({
        path: "teamMember.id",
        select:
          "userName designation employeeId firstName lastName email personalInformation.telephones",
      })
      .populate({
        path: "teamMember.image",
        select: "path",
      });
    res.status(200).json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-team",auth, async (req, res) => {
  try {
    const users = await Team.find({})
      .populate({
        path: "teamLeader.id",
        select:
          "userName designation employeeId firstName lastName email personalInformation.telephones",
      })
      .populate({
        path: "teamLeader.image",
        select: "path",
      })
      .populate({
        path: "teamMember.id",
        select:
          "userName designation employeeId firstName lastName email personalInformation.telephones",
      })
      .populate({
        path: "teamMember.image",
        select: "path",
      });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-team",auth, async (req, res) => {
  try {
    const updatedFields = req.body;
    await Team.findOneAndUpdate(
      { _id: req.body.id },
      { $set: updatedFields },
      { new: true, upsert: true }
    );
    res.status(200).send({ message: "Team updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/team-delete/:id",auth, async (req, res) => {
  try {
    let { id } = req.params;
    let deleted = await Team.deleteOne({ _id: id });
    res.status(200).send({ message: "Team deleted successfully!", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
