const express = require("express");
const dotenv = require("dotenv");
const db = require("./db");
const cors = require('cors');
const path = require("path");
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const adminRoutes = require("./routes/admin");
const bodyParser = require('body-parser');

// Load env vars
dotenv.config();

// Init app
const app = express();
app.use((req, res, next) => { process.env.TZ = process.env.MY_TIMEZONE || 'Asia/Ho_Chi_Minh'; next(); });
app.use(bodyParser.json({ limit: '20mb' })); // Áp dụng cho JSON
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
app.use(express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) => {
  res.render("layout", { 
    title: "Đăng nhập",
    content: "auth/login" // Đường dẫn đến file EJS của trang đăng nhập
  });
});

app.get("/dashboard", (req, res) => {
  res.render("layout", { 
    title: "Dashboard",
    content: "dashboard"
  });
});

app.get("/attandance", (req, res) => {
  res.render("layout", { 
    title: "Chấm công",
    content: "attendance/attandance_manager"
  });
});

app.get("/log_checkin", (req, res) => {
  res.render("layout", { 
    title: "Ghi nhận chấm công vào",
    content: "log/log_checkin"
  });
});

app.get("/log_checkout", (req, res) => {
  res.render("layout", { 
    title: "Ghi nhận chấm công ra",
    content: "log/log_checkout"
  });
});

app.get("/log_login", (req, res) => {
  res.render("layout", { 
    title: "Ghi nhận đăng nhập",
    content: "log/log_login"
  });
});

app.get("/log_register", (req, res) => {
  res.render("layout", { 
    title: "Ghi nhận đăng ký",
    content: "log/log_register"
  });
});

app.get("/resume1", (req, res) => {
  res.render("layout", { 
    title: "Quản lí đơn",
    content: "resume/resume_attandance"
  });
});

app.get("/resumeapprove", (req, res) => {
  res.render("layout", { 
    title: "Các đơn đã chấp thuận",
    content: "resume/resume_attandance_approve"
  });
});

app.get("/resumecancel", (req, res) => {
  res.render("layout", { 
    title: "Các đơn đã hủy",
    content: "resume/resume_attandance_cancel"
  });
});

app.get("/setting_location", (req, res) => {
  res.render("layout", { 
    title: "Quản lí vị trí",
    content: "setting/setting_location"
  });
});

app.get("/setting_time", (req, res) => {
  res.render("layout", { 
    title: "Quản lí thời gian",
    content: "setting/setting_time"
  });
});

app.get("/settingresume", (req, res) => {
  res.render("layout", { 
    title: "Quản lí đơn",
    content: "setting/setting_resume"
  });
});

app.get("/staff_manager", (req, res) => {
  res.render("layout", { 
    title: "Quản lí nhân viên",
    content: "staff/staff_manager"
  });
});

app.get("/staff_manager_restore", (req, res) => {
  res.render("layout", { 
    title: "Quản lí khôi phục nhân viên",
    content: "staff/staff_manager_restore"
  });
});

app.get("/role", (req, res) => {
  res.render("layout", { 
    title: "Role",
    content: "role/role"
  });
});

app.get("/notification", (req, res) => {
  res.render("layout", { 
    title: "notification",
    content: "notification/notification"
  });
});

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use('/webfonts', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/webfonts'));
app.use('/css', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/css'));


app.use((req, res) => {
  res.status(404).render('404'); // Render tệp 404.ejs
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});