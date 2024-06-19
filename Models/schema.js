const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  dob: String,
  bloodGroup: String,
  avatar: String,
  designation: String,
  date_of_join: String,

  isAdmin: { type: Boolean, default: false },
  tasks: [
    {
      task_name: String,
      task_status: { type: String, default: "Pending" },
      check_in_time: { type: String, default: null },
      check_out_time: { type: String, default: null }, // Add check_out_time
    },
  ],
  employeeID: { type: String, unique: true },
});

const User = mongoose.model("User", UserSchema);



const CheckInOutSchema = new mongoose.Schema({
  check_in_time: { type: String, default: null },
  check_out_time: { type: String, default: null },
  check_in_location: String,
  check_out_location: String,
  workHours: { type: String, default: null },
  check_in_date: String,
  check_out_date: String,  // Add check_out_date
});

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Store the date in DD-MM-YYYY format
  checkInOuts: [CheckInOutSchema], // Array of check-in/out records
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);


// Define Designation Schema
const DesignationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Other fields specific to designations...
});

const Designation = mongoose.model("Designation", DesignationSchema);

module.exports = { Designation, User , Attendance };
