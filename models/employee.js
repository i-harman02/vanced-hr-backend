const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
  },
  email: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  designation: {
    type: String,
  },
  address: {
    type: String,
  },
  gender: {
    type: String,
  },
  employeeId: {
    type: String,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
  },
  personalInformation: {
    telephones: [
      {
        type: Number,
      },
    ],
    nationality: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
  },
  emergencyContact: {
    primary: {
      name: {
        type: String,
      },
      relationship: {
        type: String,
      },
      phone: [
        {
          type: String,
        },
      ],
    },
    secondary: {
      name: {
        type: String,
      },
      relationship: {
        type: String,
      },
      phone: [
        {
          type: String,
        },
      ],
    },
  },
  bankInformation: {
    bankName: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    panNo: {
      type: String,
    },
    aadharCardNo: {
      type: String,
    },
  },
  education: [
    {
      institution: {
        type: String,
      },
      degree: {
        type: String,
      },
      fieldOfStudy: {
        type: String,
      },
      startYear: {
        type: String,
      },
      endYear: {
        type: String,
      },
    },
  ],
  experience: [
    {
      jobTitle: {
        type: String,
      },
      companyName: {
        type: String,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
  ],
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
