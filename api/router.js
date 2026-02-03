const express = require("express");
const router = express.Router();

const employee = require("./routes/employee/employee");
const users = require("./routes/users/users");  
const auth = require("./routes/auth/auth");
const image = require("./routes/imageUpload/image");
const holiday = require("./routes/holidayList");
const leave = require("./routes/onLeave");
const project = require("./routes/projectDetail/project");
const team = require("./routes/team/team");
const client = require("./routes/clientDetail/client");
const performance = require("./routes/performance/performance");
const announcement = require("./routes/announcement/announcement");
const dashBoard = require("./routes/dashBoard/dashBoard");
const comment = require("./routes/comment/comment");
const promotion = require("./routes/promotion");
const resignation = require("./routes/employeeResignation");
const termination = require("./routes/termination");
const birthday = require("./routes/employeeBirthday");
const appraisalDate = require("./routes/employeeAppraisal");
const workAnniversary = require("./routes/workAnniversary");
const policy = require("./routes/policy/index");
    
const csvUplaod = require("./routes/csvUpload/csvUpload");
/**
 * @openapi
 * /api/employee/add-employee:
 *   post:
 *     summary: Register a new employee.
 *     description: Register a new employee with the provided details.
 *     requestBody:
 *       description: Employee details to be registered.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               email:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               designation:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               profileImageURL:
 *                 type: string
 *               personalInformation:
 *                 type: object
 *                 properties:
 *                   telephones:
 *                     type: array
 *                     items:
 *                       type: number
 *                   nationality:
 *                     type: string
 *                   religion:
 *                     type: string
 *                   maritalStatus:
 *                     type: string
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   primary:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       relationship:
 *                         type: string
 *                       phone:
 *                         type: array
 *                         items:
 *                           type: string
 *                   secondary:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       relationship:
 *                         type: string
 *                       phone:
 *                         type: array
 *                         items:
 *                           type: string
 *               bankInformation:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   bankAccountNumber:
 *                     type: string
 *                   ifscCode:
 *                     type: string
 *                   panNo:
 *                     type: string
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     institution:
 *                       type: string
 *                     degree:
 *                       type: string
 *                     fieldOfStudy:
 *                       type: string
 *                     startYear:
 *                       type: number
 *                     endYear:
 *                       type: number
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     jobTitle:
 *                       type: string
 *                     companyName:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Employee registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request. Invalid input data.
 *       409:
 *         description: Conflict. Email already exists.
 *       500:
 *         description: Internal Server Error. Something went wrong.
 */

router.use("/employee", employee);
router.use("/users", users);
router.use("/auth", auth);
router.use("/image", image);
router.use("/holiday", holiday);
router.use("/leave", leave);
router.use("/project", project);
router.use("/team", team);
router.use("/client", client);
router.use("/performance", performance);
router.use("/announcement", announcement);
router.use("/dash-board", dashBoard);
router.use("/comment", comment);
router.use("/promotion", promotion);
router.use("/resignation", resignation);
router.use("/termination", termination);
router.use("/birthday", birthday);
router.use("/appraisalDate", appraisalDate);
router.use("/workAnniversary", workAnniversary);
router.use("/policy", policy);
router.use("/csvUplaod", csvUplaod);

module.exports = router;
