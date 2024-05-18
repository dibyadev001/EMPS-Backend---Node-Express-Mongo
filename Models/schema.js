const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  dob: String,
  bloodGroup: String,
  avatar: String,
  designation: String,

  isAdmin: { type: Boolean, default: false },
  tasks: [
    {
      task_name: String,
      task_status: { type: String, default: "Pending" },
      check_in_time: { type: String, default: null },
      check_out_time: { type: String, default: null }, // Add check_out_time
    },
  ],
  attendance: [
    {
      check_in_time: { type: String, default: null },
      check_in_date: String,
      check_out_date: String,
      check_in_location: String,
      check_out_location: String,
      check_out_time: { type: String, default: null }, // Add check_out_time
      workHours: { type: String, default: null },
    },
  ],
  employeeID: { type: String, unique: true },
});

const User = mongoose.model("User", UserSchema);

// Define Designation Schema
const DesignationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Other fields specific to designations...
});

const Designation = mongoose.model("Designation", DesignationSchema);

module.exports = { Designation, User };
