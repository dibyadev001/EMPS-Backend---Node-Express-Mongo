const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../Middleware/middleware");
const {
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
  assignAdminRole,
  createAdmin,
  createEmployee,
  uploadAvatar,
} = require("../Controllers/controller"); //controller import
const {upload}= require("../Middleware/middleware")

router.post("/signup/admin", createAdmin);
router.post("/signup/employee", createEmployee);
router.post("/upload-avatar/:userId", upload.single("avatar"), uploadAvatar);


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
