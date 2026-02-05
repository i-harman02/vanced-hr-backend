const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  password: {
    type: String,
  },
  role: {
    type: String,
  },
  superAdmin: {
    type: Boolean,
  },
  assignRole: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    trim: true,
  },
  employeeSalary: {
    type: Number,
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

  lastName: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
  },
  acceptPolicies: {
    type: Boolean,
    default: false,
  },
  tl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  appraisalDate: {
    type: Date,
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
    bankAccountName: {
      type: String,
    },
  },
  identityInformation: {
    panNo: {
      type: String,
    },
    panName: {
      type: String,
    },
    panAddress: {
      type: String,
    },
    fatherName: {
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
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
