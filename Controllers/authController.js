const { User } = require("../Models/schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {resizeAndConvert}=require("../Helpers/helper")
const {getCurrentDateAndTime}=require("../Helpers/helper")

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
    const { date } = getCurrentDateAndTime();

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
      date_of_join:date
    });

    await newUser.save();
    res.status(201).json({
      status: 1,
      message: "Admin user created successfully",
      employeeID: newUser.employeeID,
      userId:newUser._id
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
      userId: newUser._id,

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


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: user.email, isAdmin: user.isAdmin },
      "dibya",
      { expiresIn: "3d" }
    );

    res.json({
      status: 1,
      message: "Login successful",
      token,
      userid: user._id,
      isAdmin: user.isAdmin,
      username:user.name
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createAdmin, createEmployee ,uploadAvatar,login};