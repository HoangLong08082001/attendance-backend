const express = require("express");
const adminAuth = require("../middlewares/adminAuth");
const router = express.Router();
const jwt = require("jsonwebtoken")

// Sử dụng middleware cho tất cả route admin
router.use(adminAuth);

// Route yêu cầu quyền admin
router.get("/protectedRoute", adminAuth, (req, res) => {
  const roleName = req.user?.roleName || "Unknown ROLE";
  const userName = req.user?.userName || "Unknown User";
  const avatar = req.user?.avatar || "Unknown Image";
  const attendance_select = req.user?.attendance_select || "false";
  const staff_select = req.user?.staff_select || "false";
  const staff_update = req.user?.staff_update || "false";
  const resume_select = req.user?.resume_select || "false";
  const log_select = req.user?.log_select || "false";
  const setting_select = req.user?.setting_select || "false";
  const cms_dashboard = req.user?.cms_dashboard || "false";
  const role_select = req.user?.role_select || "false";
  const notification_select = req.user?.notification_select || "false";
  res.json({ message: `Welcome,  ${userName} !!`, attendance_select, staff_select, resume_select, log_select, 
    setting_select, roleName, userName,cms_dashboard,role_select, avatar, staff_update , notification_select});
});

// Route đăng nhập
router.post("/login", (req, res) => {
  // Giả sử bạn đã kiểm tra đăng nhập thành công và tạo token
  const token = jwt.sign({ roleId: 1 }, process.env.JWT_SECRET, { expiresIn: '168h' }); // RoleId = 1 cho admin
  res.json({ token });
});

// Export router
module.exports = router;
