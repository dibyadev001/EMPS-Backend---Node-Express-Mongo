const { Designation } = require("../Models/schema");
const { User } = require("../Models/schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
  getCurrentDateAndTime,
  calculateElapsedTime,
} = require("../Helpers/helper");

async function createDesignation(req, res) {
  try {
    // Check if the requester is an admin
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }

    const { name } = req.body;

    // Check if the name is provided
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create the designation
    const newDesignation = await Designation.create({ name });

    res.status(201).json({
      message: "Designation created successfully",
      designation: newDesignation,
    });
  } catch (error) {
    console.error("Error creating designation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getDesignations(req, res) {
  try {
    // Check if the requester is an admin
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }

    const designations = await Designation.find();
    res.status(200).json({ designations });
  } catch (error) {
    console.error("Error getting designation listing:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function assignDesignation(req, res) {
  try {
    const { userId } = req.params;
    const { designationId } = req.body;
    // Check if the requester is an admin
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the designation by ID
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return res.status(404).json({ error: "Designation not found" });
    }

    // Assign the designation to the user
    user.designation = designation.name;
    await user.save();

    res.json({ status: 1, message: "Designation assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const generateEmployeeID = () => {
  const min = 1000;
  const max = 9999;
  return "DB" + Math.floor(Math.random() * (max - min + 1) + min);
};

const isEmployeeIDUnique = async (employeeID) => {
  const existingUser = await User.findOne({ employeeID });
  return !existingUser;
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password, dob, bloodGroup } = req.body;
    let employeeID;
    let isUnique = false;

    while (!isUnique) {
      employeeID = generateEmployeeID();
      isUnique = await isEmployeeIDUnique(employeeID);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: 0, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      bloodGroup,
      isAdmin: true,
      employeeID,
    });

    await newUser.save();
    res.status(201).json({
      status: 1,
      message: "Admin user created successfully",
      employeeID: newUser.employeeID,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, email, password, dob, bloodGroup } = req.body;
    let employeeID;
    let isUnique = false;

    while (!isUnique) {
      employeeID = generateEmployeeID();
      isUnique = await isEmployeeIDUnique(employeeID);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: 0, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      bloodGroup,
      employeeID,
    });

    await newUser.save();
    res.status(201).json({
      status: 1,
      message: "User created successfully",
      employeeID: newUser.employeeID,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = await resizeAndConvert(req.file.buffer);
    const avatar = buffer.toString("base64");

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      status: 1,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verifyIDAndRecordAttendance = async (req, res) => {
  const { employeeID, location } = req.body;

  try {
    const user = await User.findOne({ employeeID });
    if (!user) {
      return res
        .status(404)
        .json({ message: `No match found for employee ID ${employeeID}` });
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${day}-${month}-${year}`;

    const todaysAttendance = user.attendance.filter(
      (record) => record.date === formattedToday
    );

    if (todaysAttendance.length < 3) {
      const currentTime = new Date().toLocaleTimeString("en-IN", {
        hour12: true,
      });

      user.attendance.push({
        check_in_time: currentTime,
        date: formattedToday,
        location: location,
      });
      await user.save();

      res.json({
        status: 1,
        message: `Scan recorded for employee ID ${employeeID}`,
        user,
      });
    } else {
      res.json({
        status: 0,
        message: `<div style="font-weight: bold; color: red;">Card has already been scanned three times today for employee ID ${employeeID}</div>`,
        user,
      });
    }
  } catch (error) {
    console.error("Error verifying employee ID:", error);
    res.status(500).json({ message: "Error verifying employee ID" });
  }
};



const getNameByToken = async (req, res) => {
  const { token } = req.params;

  try {
    jwt.verify(token, "dibya", async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { email } = decoded;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ name: user.name });
    });
  } catch (error) {
    console.error("Error fetching user name:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getEmployeeID = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ employeeID: user.employeeID });
  } catch (error) {
    console.error("Error fetching employeeID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const usersWithAvatar = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      dob: user.dob,
      bloodGroup: user.bloodGroup,
      employeeID: user.employeeID,
      designation: user.designation,
    }));
    res.json(usersWithAvatar);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const assignAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (isAdmin === undefined || isAdmin === null) {
      return res.status(400).json({ error: "Please provide isAdmin status" });
    }

    // Check if the requester is a super admin
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update user's isAdmin status
    await User.findByIdAndUpdate(userId, { isAdmin });

    res.json({ status: 1, message: "Admin role assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDetails = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      tasks: user.tasks,
      dob: user.dob,
      bloodGroup: user.bloodGroup,
      employeeID: user.employeeID,
      designation:user.designation
    };

    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const assignTask = async (req, res) => {
  try {
    const { userId } = req.params;
    const { task_name } = req.body;

    if (!task_name) {
      return res.status(400).json({ error: "Please provide a task name" });
    }

    // Check if the requester is authorized
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update user's tasks
    await User.findByIdAndUpdate(userId, {
      $push: {
        tasks: {
          task_name,
          task_status: "Pending",
          check_in_time: null,
          check_out_time: null,
        },
      },
    });

    res.json({ status: 1, message: "Task assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, "dibya", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    next();
  });
}

// Update task details
const updateTaskDetails = async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    const { task_status, check_in_time, check_out_time } = req.body;

    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const taskIndex = user.tasks.findIndex(
      (task) => task._id.toString() === taskId
    );
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task_status) user.tasks[taskIndex].task_status = task_status;
    if (check_in_time) user.tasks[taskIndex].check_in_time = check_in_time;
    if (check_out_time) user.tasks[taskIndex].check_out_time = check_out_time;

    await user.save();

    res.json({ status: 1, message: "Task details updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get analytics data (admin only)
const getAnalytics = async (req, res) => {
  try {
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }

    const users = await User.find().populate("tasks");
    const analyticsData = [];

    const totalEmployees = users.length;
    let totalTasksAssigned = 0;

    users.forEach((user) => {
      const userData = {
        userId: user._id,
        userName: user.name,
        tasks: [],
      };

      user.tasks.forEach((task) => {
        const taskData = {
          taskId: task._id,
          taskName: task.task_name,
          taskStatus: task.task_status,
          checkInTime: task.check_in_time,
          checkOutTime: task.check_out_time,
        };
        userData.tasks.push(taskData);
        totalTasksAssigned++;
      });

      analyticsData.push(userData);
    });

    const response = {
      totalEmployees,
      totalTasksAssigned,
      analyticsData,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }

    const { userId } = req.params;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.json({ status: 1, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update user details (admin only)
const updateUserDetails = async (req, res) => {
  try {
    const requesterEmail = req.user.email;
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !requester.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden, only admins can access this endpoint" });
    }

    const { userId } = req.params;
    const { name, email, password } = req.body;

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userToUpdate.password = hashedPassword;
    }

    await userToUpdate.save();

    res.json({ status: 1, message: "User details updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user suggestions
const getSuggestions = async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }
    const searchTermRegex = new RegExp(searchTerm.toLowerCase(), "i");

    const users = await User.find({
      $or: [
        { employeeID: { $regex: searchTermRegex } },
        { name: { $regex: searchTermRegex } },
      ],
    });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: `No users found matching ${searchTerm}` });
    }

    const suggestions = users.map((user) => ({
      name: user.name,
      employeeID: user.employeeID,
      email: user.email,
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Error fetching suggestions" });
  }
};

// Get user avatar by employee ID
const getAvatarByEmployeeID = async (req, res) => {
  try {
    const { employeeID } = req.params;

    const user = await User.findOne({ employeeID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.avatar) {
      return res.status(404).json({ error: "Avatar not found for this user" });
    }

    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Check if user is admin
const checkAdmin = async (req, res) => {
  try {
    const { isAdmin } = req.user;
    res.json({ isAdmin });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "roxane68@ethereal.email",
        pass: "hKdZwVS3v7evCRtcs7",
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000);

    const info = await transporter.sendMail({
      from: "19410121127.i.dibyajyotiprakash@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for verification is: ${otp}`,
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Email</title>
          <style>
              body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .otp-section { background: #f9f9f9; padding: 20px; border-radius: 5px; }
              .otp-section h2 { margin-top: 0; }
              .otp-code { font-size: 24px; text-align: center; padding: 10px 0; border: 2px dashed #333; border-radius: 5px; margin-bottom: 20px; }
              .btn { display: block; width: 100%; background-color: #007bff; color: #fff; text-align: center; padding: 10px 0; border: none; border-radius: 5px; text-decoration: none; cursor: pointer; }
              .btn:hover { background-color: #0056b3; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>OTP Email</h1>
              </div>
              <div class="otp-section">
                  <h2>Your One-Time Password (OTP)</h2>
                  <div class="otp-code">${otp}</div>
                  <p>Please use the above OTP to proceed.</p>
                  <p>If you didn't request this OTP, please ignore this email.</p>
              </div>
              <div class="footer">
                  <p>This email was sent automatically. Please do not reply.</p>
              </div>
          </div>
      </body>
      </html>`,
    });

    console.log("Message sent: %s", info.messageId, otp);

    res.status(200).json({ otp, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Check-in
const checkIn = async (req, res) => {
  const { userId, check_in_location } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 0, error: "User not found" });
    }

    const { date, time } = getCurrentDateAndTime();

    user.attendance.push({
      check_in_time: time,
      check_in_date: date,
      check_in_location: check_in_location,
    });

    await user.save();
    return res.status(200).json({ status: 1, message: "Check-in successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Check-out
const checkOut = async (req, res) => {
  const { userId, check_out_location, workHours } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { date, time } = getCurrentDateAndTime();

    const latestAttendance = user.attendance[user.attendance.length - 1];
    if (!latestAttendance || latestAttendance.check_out_time) {
      return res
        .status(400)
        .json({ status: 0, error: "No valid check-in found" });
    }

    latestAttendance.check_out_time = time;
    latestAttendance.check_out_date = date;
    latestAttendance.check_out_location = check_out_location;
    latestAttendance.workHours = workHours;

    await user.save();
    return res.status(200).json({ status: 1, message: "Check-out successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get check-in status
const getCheckStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const latestAttendance = user.attendance[user.attendance.length - 1];
    const isCheckedIn = latestAttendance && !latestAttendance.check_out_time;

    res.status(200).json({ isCheckedIn });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get elapsed time
const getElapsedTime = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const latestAttendance = user.attendance[user.attendance.length - 1];
    if (!latestAttendance || latestAttendance.check_out_time) {
      return res.status(400).json({ error: "No active check-in found" });
    }

    const elapsedTime = calculateElapsedTime(latestAttendance.check_in_time);

    res.status(200).json({ elapsedTime });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  verifyIDAndRecordAttendance,
  getNameByToken,
  getEmployeeID,
  createDesignation,
  getDesignations,
  assignDesignation,
  getUserProfile,
  updateTaskDetails,
  getAnalytics,
  deleteUser,
  updateUserDetails,
  getSuggestions,
  getAvatarByEmployeeID,
  checkAdmin,
  sendOTP,
  checkIn,
  checkOut,
  getCheckStatus,
  getElapsedTime,
  getAllUsers,
  assignAdminRole,
  uploadAvatar,
  assignTask
};
