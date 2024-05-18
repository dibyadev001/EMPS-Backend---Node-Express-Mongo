const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../Middleware/middleware");
const {
  createAdmin,
  createEmployee,
  verifyIDAndRecordAttendance,
  login,
  getNameByToken,
  getEmployeeID,
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
  assignAdminRole
} = require("../Controllers/controller"); //controller import
const {upload}=require("../Helpers/helper")

router.post("/signup/admin", upload, createAdmin);
router.post("/signup/employee", upload, createEmployee);
router.post("/api/verify", verifyIDAndRecordAttendance);
router.post("/login", login);
router.get("/api/get-name/:token", getNameByToken);
router.get("/api/get-employeeID", authenticateToken, getEmployeeID);

// New routes
router.get("/user/:userId", authenticateToken, getUserProfile);
router.put(
  "/update-task/:userId/:taskId",
  authenticateToken,
  updateTaskDetails
);
router.get("/analytics", authenticateToken, getAnalytics);
router.delete("/user/:userId", authenticateToken, deleteUser);
router.put("/user/:userId", authenticateToken, updateUserDetails);
router.get("/api/suggestions", authenticateToken, getSuggestions);
router.get("/avatar/:employeeID", getAvatarByEmployeeID);
router.get("/api/check-admin", authenticateToken, checkAdmin);
router.post("/api/send-otp", sendOTP);

router.post("/checkin", checkIn);
router.post("/checkout",checkOut);
router.get("/checkstatus/:userId", getCheckStatus);
router.get("/elapsedtime/:userId", getElapsedTime);
router.get("/users", authenticateToken,getAllUsers);
router.put(
  "/assign-admin/:userId",
  authenticateToken,
  assignAdminRole
);
module.exports = router;
