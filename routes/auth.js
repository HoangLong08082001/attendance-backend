const express = require("express");
const { register, login, forgorPass, loginCMSAdmin } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgor-password", forgorPass);
router.post("/loginCMS", loginCMSAdmin);

module.exports = router;
