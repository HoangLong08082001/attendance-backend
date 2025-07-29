const { supabase } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {
  generateUniqueRandomNumberString,
  generateRandomString,
} = require("../function/globalFunction");
const { transport } = require("../config/setupMail");
const code = generateUniqueRandomNumberString(5);
const newPass = generateRandomString(6);

//
async function logToDatabase(staffId, description) {
  console.log(`Logging to database: ${description}`); // Debug line
  const { error: logError } = await supabase
    .from("loglogin")
    .insert([{ staff_id: staffId, description }]);

  if (logError) {
    console.error(`Error logging to loglogin: ${logError.message}`);
  } else {
    console.log(`Log entry inserted successfully: ${description}`);
  }
}

exports.register = async (req, res) => {
  const { id_staff, name, email, birth, phone, password } = req.body;

  try {
    // Kiểm tra email hoặc số điện thoại đã tồn tại chưa
    const { data: existingUser, error: checkError } = await supabase
      .from("staff")
      .select("id_staff")
      .or(`email.eq.${email},phone.eq.${phone}`);

    if (checkError) {
      return res.status(500).json({ error: checkError.message });
    }

    if (existingUser && existingUser.length > 0) {
      return res
        .status(400)
        .json({ error: "Email hoặc số điện thoại đã được đăng ký." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into staff table
    const { data, error: userError } = await supabase.from("staff").insert([
      {
        id_staff,
        name,
        email,
        birth,
        phone,
        password: hashedPassword,
        status: true,
        avatar:
          "https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-83.jpg",
        role_id: 2,
      },
    ]);

    if (userError) {
      // Log the registration error
      await supabase.from("logregister").insert([
        {
          staff_id: id_staff,
          description: `Registration failed: ${userError.message}`,
        },
      ]);
      return res.status(500).json({ error: userError.message });
    }

    // Log successful registration
    await supabase
      .from("logregister")
      .insert([
        { staff_id: id_staff, description: "User registered successfully" },
      ]);

    res.status(201).json({ message: "Success" });
  } catch (err) {
    // Log any unexpected error
    await supabase.from("logregister").insert([
      {
        staff_id: id_staff,
        description: `Registration failed: ${err.message}`,
      },
    ]);
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { login, password, ip } = req.body;
  console.log("Login attempt received:", login); // Debug

  try {
    // Retrieve user data based on email or phone
    const { data: users, error: userError } = await supabase
      .from("staff")
      .select("*")
      .or(`email.eq.${login},phone.eq.${login}`)
      .single();

    if (userError || !users) {
      console.log("User not found, logging attempt...");
      await logToDatabase(null, "Login failed: User not found");
      return res
        .status(404)
        .json({ error: "User not found with provided email or phone" });
    }

    console.log("User found:", users); // Debug
    const user = users;
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid password, logging attempt...");
      await logToDatabase(
        String(user.id_staff),
        "Login failed: Invalid password"
      );
      return res.status(400).json({ error: "Invalid password" });
    }

    console.log("Password valid, generating token..."); // Debug

    if (user.status !== true) {
      console.log("Invalid status, logging attempt...");
      await logToDatabase(
        String(user.id_staff),
        "Login failed: Invalid status"
      );
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check IP conditions
    if (!user.description_ip) {
      // If description_ip is null, update it with the provided IP
      const { error: ipUpdateError } = await supabase
        .from("staff")
        .update({ description_ip: ip })
        .eq("id_staff", user.id_staff);

      if (ipUpdateError) {
        console.log("Failed to update IP:", ipUpdateError.message);
        await logToDatabase(
          String(user.id_staff),
          "Login failed: IP update error"
        );
        return res.status(500).json({ error: "Failed to update IP address" });
      }
    } else if (user.description_ip !== ip) {
      console.log("IP mismatch, logging attempt...");
      await logToDatabase(String(user.id_staff), "Login failed: Invalid IP");
      return res.status(400).json({ error: "Invalid IP" });
    }

    // if (user.description_ip === ip) {
    const { data, error: managerError } = await supabase
      .from("staff")
      .select("*")
      .eq("name", user.manager)
      .single();

    const { data: role, error: managerErrorr } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", user.role_id)
      .single();

    const { data: usertime, error: errortime } = await supabase
      .from("staff")
      .select(
        "*,setting_time:id_time(id_settingtime,checkin_time,checkout_time)"
      )
      .eq("id_staff", user.id_staff)
      .single();
    const token = jwt.sign(
      {
        userId: user.id_staff,
        userRole: user.role_id,
        userCheck: user.auto_check,
        manager: data.id_staff,
        is_annual: user.isAnnual,
        resume_select: role.resume_select,
        resume_update: role.resume_update,
        id_setting_time: user.id_time,
        checkin_setting: usertime.setting_time.checkin_time,
        checkout_setting: usertime.setting_time.checkout_time,
      },
      process.env.JWT_SECRET,
      { expiresIn: "100y" }
    );

    console.log("Login successful, logging attempt..."); // Debug
    await logToDatabase(String(user.id_staff), "Login successful");

    return res.status(200).json({ token, message: "Success" });
    // }
  } catch (err) {
    console.log("Unexpected error occurred:", err.message);
    await logToDatabase(null, `Login failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
};

//send mail forgor pass
exports.forgorPass = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    // Query for the user by email or phone
    const { data: user, error: userError } = await supabase
      .from("staff")
      .select("email, phone")
      .or(`email.eq.${email},phone.eq.${email}`)
      .single(); // Use .single() to get one user record

    if (userError || !user) {
      return res.status(404).json({ message: "Cannot find the email" });
    }
    console.log(user);
    // Generate a new password and hash it
    const newPass = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPass, 10);
    // Update the user's password
    const { error: updateError } = await supabase
      .from("staff")
      .update({ password: hashedPassword })
      .match({ email: user.email }); // Use match to update the right user

    if (updateError) {
      return res
        .status(500)
        .json({ error: `Failed to update password: ${updateError.message}` });
    }

    // Set up the email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      service: "gmail",
      secure: false,
      auth: {
        user: "ecoopmart.app@gmail.com",
        pass: "sjbkmpqfaarehukq",
      },
    });
    // Set up the email options
    const mailOptions = {
      from: "admin@system.vn",
      to: email,
      subject: `New Password Assignment for Account ${email}`,
      text: `New password: ${newPass}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      }
      if (info) {
        return res
          .status(200)
          .json({ message: "New password has been sent to your email" });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// đăng nhập cho trang CMS Admin
exports.loginCMSAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query for the user by email or phone
    const { data: user, error: userError } = await supabase
      .from("staff")
      .select("*")
      .or(`email.eq.${username},phone.eq.${username}`)
      .single(); // Use .single() to get one user record

    if (userError || !user) {
      // Log failed login attempt (user not found)
      await logToDatabase(null, "Login failed: User not found");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt (invalid password)
      await logToDatabase(user.id_staff, "Login failed: Invalid password");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Get the user's role
    const { data: role, error: roleError } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", user.role_id)
      .single();

    if (roleError || !role) {
      // Log failed login attempt (no role assigned)
      await logToDatabase(user.id_staff, "Login failed: No role assigned");
      return res
        .status(403)
        .json({ success: false, message: "No role assigned" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id_staff,
        userName: user.name,
        avatar: user.avatar,
        roleId: role.role_id,
        roleName: role.name_role,
        attendance_select: role.attendance_select,
        staff_select: role.staff_select,
        resume_select: role.resume_select,
        log_select: role.log_select,
        staff_update: role.staff_update,
        resume_update: role.resume_update,
        setting_update: role.setting_update,
        setting_select: role.setting_select,
        cms_dashboard: role.cms_dashboard,
        role_select: role.role_select,
        role_update: role.role_update,
        notification_select: role.notification_select,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "100y",
      }
    );

    // Log successful login
    await logToDatabase(user.id_staff, "Login successful");

    // Return response
    res.status(200).json({
      success: true,
      token,
      role_id: role.role_id,
    });
  } catch (error) {
    // Log unexpected server error
    await logToDatabase(null, `Login failed: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
