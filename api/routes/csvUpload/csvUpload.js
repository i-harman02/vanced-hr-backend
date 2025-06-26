const express = require("express");
const bcrypt = require("bcrypt");
const Employee = require("../../../models/employee");
const Image = require("../../../models/image");
const config = require("../../../config");
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

const router = express.Router();
const saltRounds = 10;
const upload = multer({ dest: 'uploads/' });

function excelDateToJSDate(serial) {
  if (typeof serial !== 'number') return null;
  const utcDays = Math.floor(serial - 25569); // Excel date offset from 1970-01-01
  const utcValue = utcDays * 86400; // seconds
  return new Date(utcValue * 1000); // convert to milliseconds
}

router.post("/upload-csv", upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Remove header (first row)
   let rows = data.slice(1);
   rows = rows.filter(row => row.length > 0);
    for (const row of rows) {
  if (row.length > 0) {
    const existingEmployee = await Employee.findOne({ email: row[11] });

    const hashedPassword = existingEmployee?.password || await bcrypt.hash(row[25]?.toString() || '123456', saltRounds);

    const employeeData = {
      employeeId: row[1]?.toString(),
      firstName: row[2],
      gender: row[3],
      birthday: excelDateToJSDate(row[4]),
      personalInformation: {
        maritalStatus: row[5],
        bloodGroup: row[15],
        telephones: [row[10]?.toString()],
        nationality: row[27]
      },
      identityInformation: {
        fatherName: row[6],
        panNo: row[17]
      },
      dateOfJoining: excelDateToJSDate(row[7]),
      assignRole: row[8],
      designation: row[9],
      email: row[11],
      address: row[13],
      bankInformation: {
        bankAccountNumber: row[18]?.toString(),
        ifscCode: row[19],
        bankName: row[20]
      },
      emergencyContact: {
        primary: {
          phone: [row[21]?.toString()],
          name: row[22],
          relationship: row[23]
        }
      },
      password: hashedPassword,
      role: row[26],
    };

    // If employee exists, update; otherwise insert new
    await Employee.findOneAndUpdate(
      { email: row[11] },
      { $set: employeeData },
      { upsert: true, new: true }
    );
  }
}
  //  const employees = await Promise.all(rows.map(async row => {
  //   if(row.length > 0){
  //   const hashedPassword = await bcrypt.hash(row[25]?.toString() || '123456', saltRounds);

  //   return {
  //     employeeId: row[1]?.toString(),
  //     firstName: row[2],
  //     gender: row[3],
  //     birthday: excelDateToJSDate(row[4]),
  //     personalInformation: {
  //       maritalStatus: row[5],
  //       bloodGroup: row[15],
  //       telephones: row[10]?.toString(),
  //       nationality: row[27]
  //     },
  //     identityInformation: {
  //       fatherName: row[6],
  //       panNo: row[17]
  //     },
  //     dateOfJoining: excelDateToJSDate(row[7]),
  //     assignRole: row[8],
  //     designation: row[9],
  //     email: row[11],
  //     address: row[13],
  //     bankInformation: {
  //       bankAccountNumber: row[18]?.toString(),
  //       ifscCode: row[19],
  //       bankName: row[20]
  //     },
  //     emergencyContact: {
  //       primary: {
  //         phone: row[21],
  //         name: row[22],
  //         relationship: row[23]
  //       }
  //     },
  //     password: hashedPassword,
  //     role: row[26],
  //   };
  // }
  // }));
  // if(employees !== 'undefined'){
  //   await Employee.insertMany(employees);
  // }

    res.status(201).json({
      message: "Employee registered successfully",
    });
  } catch (error) {
    console.error("Error during employee registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }

});


module.exports = router;