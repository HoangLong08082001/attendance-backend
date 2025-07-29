const express = require("express");
const {
  checkIn,
  checkOut,
  changePassword,
  changeProfile,
  changeProfileAvatar,
  getAttendanceByMonth,
  getAttendanceByUser,
  getAttendanceByMonthOfAdmin,
  getAttendanceByUserOfAdmin,
  getAttendanceByAllUserOfAdmin,
  getLocation,
  staffForAdmin,
  logloginForAdmin,
  logregisterForAdmin,
  logcheckinForAdmin,
  logcheckoutForAdmin,
  getAttendanceByUserDateNow,
  timeSetting,
  updateSettingTime,
  locationSetting,
  updateSettingLocation,
  cancelStaffAccount,
  stafffalseForAdmin,
  restoreStaffAccount,
  resume1ForAdmin,
  resume2ForAdmin,
  resume3ForAdmin,
  cancelResume,
  approveResume,
  cancelStaffIP,
  updateRoleAccount,
  getInfoUser,
  getsettinglimitresume,
  insertResume1,
  resumelistforuser,
  insertResume2,
  insertResume12,
  insertResume13,
  insertResume4,
  insertResume3,
  insertResume14,
  insertResume15,
  insertResume16,
  insertResume17,
  insertResume18,
  insertResume19,
  insertResume20,
  resume4limit,
  resume3limit,
  listresumeotherforuser,
  insertResumeOther,
  resumeAllForAdmin,
  insertSettingLocation,
  deleteSettingLocation,
  getAllInfoUserForAdmin,
  getUserByAdmin,
  deleteResume,
  updateResume1,
  updateResume2,
  updateResume3,
  updateResume4,
  updateResumeOther,
  updateResume12,
  updateResume13,
  updateResume14,
  updateResume15,
  updateResume16,
  updateResume17,
  updateResume18,
  updateResume19,
  updateResume20,
  listresumeforuser,
  listresumesettingforadmin,
  deleteroleforadmin,
listroleforadmin,
addRoleForAdmin,
updateRoleForAdmin,
testnetwork,
tokennotification,
getnotification,
checknotification,
getallnotification,
resetPassword,
getAttendanceByDateAllUserOfAdmin,
getAttendanceByMonthAllUserOfAdmin,
sendnotificationfromcms
} = require("../controllers/attendanceController");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/sendnotificationfromcms", auth, sendnotificationfromcms);
router.post("/resetpassword", auth, resetPassword);
router.post("/checkin", auth, checkIn);
router.post("/checkout", auth, checkOut);
router.post("/changepassword", auth, changePassword);
router.post("/changeprofile", auth, changeProfile);
router.post("/getuserbyadmin", auth, getUserByAdmin);
router.post("/changeprofileavatar", auth, changeProfileAvatar);
router.post("/getattendancebymonth", auth, getAttendanceByMonth);
router.post("/getattendancebyuser", auth, getAttendanceByUser);
router.post("/getattendancebymonthofadmin", auth, getAttendanceByMonthOfAdmin);
router.post("/getattendancebyuserofadmin", auth, getAttendanceByUserOfAdmin);
router.post(
  "/getattendancebyalluserofadmin",
  auth,
  getAttendanceByAllUserOfAdmin
);
router.post(
  "/getattendancebydatealluserofadmin",
  auth,
  getAttendanceByDateAllUserOfAdmin
);
router.post(
  "/getattendancebymonthalluserofadmin",
  auth,
  getAttendanceByMonthAllUserOfAdmin
);
router.post("/getlocation", auth, getLocation);
router.post("/getstaffforadmin", auth, staffForAdmin);
router.post("/getloglogin", auth, logloginForAdmin);
router.post("/getlogregister", auth, logregisterForAdmin);
router.post("/getlogcheckin", auth, logcheckinForAdmin);
router.post("/getlogcheckout", auth, logcheckoutForAdmin);
router.post("/getattendancebyuserdatenow", auth, getAttendanceByUserDateNow);
router.post("/getsettingtime", auth, timeSetting);
router.post("/updatesettingtime", auth, updateSettingTime);
router.post("/getsettinglocation", auth, locationSetting);
router.post("/insertsettinglocation", auth, insertSettingLocation);
router.post("/updatesettinglocation", auth, updateSettingLocation);
router.post("/deletesettinglocation", auth, deleteSettingLocation);
router.post("/cancelaccount", auth, cancelStaffAccount);
router.post("/getstafffalseforadmin", auth, stafffalseForAdmin);
router.post("/restoreaccount", auth, restoreStaffAccount);
router.post("/getresume1foradmin", auth, resume1ForAdmin);
router.post("/getresume2foradmin", auth, resume2ForAdmin);
router.post("/getresume3foradmin", auth, resume3ForAdmin);
router.post("/getresumeallforadmin", auth, resumeAllForAdmin);
router.post("/cancelresumebyadmin", auth, cancelResume);
router.post("/deleteresume", auth, deleteResume);
router.post("/approveresumebyadmin", auth, approveResume);
router.post("/cancelstaffip", auth, cancelStaffIP);
router.post("/updateroleforstaff", auth, updateRoleAccount);
router.post("/getinfouser", auth, getInfoUser);
router.post("/getsettinglimitresume", auth, getsettinglimitresume);
router.post("/insertresume1", auth, insertResume1);
router.post("/insertresume2", auth, insertResume2);
router.post("/insertresume3", auth, insertResume3);
router.post("/insertresume12", auth, insertResume12);
router.post("/insertresume13", auth, insertResume13);
router.post("/insertresume14", auth, insertResume14);
router.post("/insertresume15", auth, insertResume15);
router.post("/insertresume16", auth, insertResume16);
router.post("/insertresume17", auth, insertResume17);
router.post("/insertresume18", auth, insertResume18);
router.post("/insertresume19", auth, insertResume19);
router.post("/insertresume20", auth, insertResume20);
router.post("/insertresume4", auth, insertResume4);
router.get("/resumelistforuser", auth, resumelistforuser);
router.get("/resume4limit", auth, resume4limit);
router.get("/resume3limit", auth, resume3limit);listresumesettingforadmin
router.get("/listresumeotherforuser", auth, listresumeotherforuser);
router.get("/listresumeforuser", auth, listresumeforuser);
router.get("/testnetwork", testnetwork);
router.post("/listresumesettingforadmin", auth, listresumesettingforadmin);
router.post("/insertresumeother", auth, insertResumeOther);
router.post("/getallinfouserforadmin", auth, getAllInfoUserForAdmin);
router.post("/updateresume1", auth, updateResume1);
router.post("/updateresume2", auth, updateResume2);
router.post("/updateresume3", auth, updateResume3);
router.post("/updateresume4", auth, updateResume4);
router.post("/updateresumeother", auth, updateResumeOther);
router.post("/updateresume12", auth, updateResume12);
router.post("/updateresume13", auth, updateResume13);
router.post("/updateresume14", auth, updateResume14);
router.post("/updateresume15", auth, updateResume15);
router.post("/updateresume16", auth, updateResume16);
router.post("/updateresume17", auth, updateResume17);
router.post("/updateresume18", auth, updateResume18);
router.post("/updateresume19", auth, updateResume19);
router.post("/updateresume20", auth, updateResume20);
router.get("/listroleforadmin", auth, listroleforadmin);
router.post("/addroleforadmin", auth, addRoleForAdmin);
router.post("/deleteroleforadmin", auth, deleteroleforadmin);
router.post("/updateroleforadmin", auth, updateRoleForAdmin);
router.post("/tokennotification", auth, tokennotification);
router.get("/getnotification", auth, getnotification);
router.post("/checknotification", auth, checknotification);
router.get("/getallnotification", auth, getallnotification);

module.exports = router;
