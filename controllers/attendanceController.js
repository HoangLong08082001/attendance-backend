const { supabase } = require("../db");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { google } = require("googleapis");
const { login } = require("./authController");
const { DateTime } = require("luxon");
const { getCurrentTimeCheckInCheckOut } = require("../function/globalFunction");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);
const cloudinary = require("cloudinary").v2;
const { Buffer } = require("buffer");
const { createClient } = require("@supabase/supabase-js");

const cloudinaryConfigs = [
  {
    cloud_name: "dw7bu5f1v",
    api_key: "837864136926399",
    api_secret: "9_0eLQF4x5urkyGxmFtdCMKZ8QM",
  },
  {
    cloud_name: "doalcoyik",
    api_key: "523945773523281",
    api_secret: "439TNwYgQOomHGc8SN4u5tbPzQE",
  },
  {
    cloud_name: "digowtlf1",
    api_key: "325438962882215",
    api_secret: "AHyYwlbFPXee6Vii-Kzie29mIok",
  },
];

let currentCloudinaryIndex = 0;

function configureCloudinary(index) {
  const config = cloudinaryConfigs[index];
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
  });
}

configureCloudinary(currentCloudinaryIndex);

async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "avatars" }, (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          currentCloudinaryIndex =
            (currentCloudinaryIndex + 1) % cloudinaryConfigs.length;
          configureCloudinary(currentCloudinaryIndex);
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(buffer);
  });
}

const credentials = {
  type: "service_account",
  project_id: "project-api-gg-map",
  private_key_id: "3ebd19ba112a2cd8abc5b46a89551ea6aacfb587",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCur8alZLSKmDeY\nsNpMEKrWIBpFF9g1Bj/8Q/YcsPh5GWmlc1aPongP5xUHIP/7CFmt4LCc6h3r2CZt\naBm5KCHI76J4O4gb8/L9Mqdi4hCgx669+bxLawA9xxMcKJkZrzqGM/Hox2FJhk7I\nthspPVwrJmUZOtbFaQUtgltrnQ56WpVKf7vkCZu9iAdZugVZoUD/hmp/yk7fBCdU\nh+/886pCbJRBzpj4d6VIR5rKRFTSv7sWh8CI8Mpc3iLWPg9XYAN1fKlPrMheL40Z\n+Vor64H19VVgmWgjNvsyizKdWqVMzAT5/k/Izvn/klTgUWQ/qm8S1UiZP3bYKf9/\nyC8p0u7lAgMBAAECggEAGKhVoyN5q4WMdXhjO/DvWF28L4wL2AI7lm12aDrfu+JH\nLBRBf/FYPrBo4rJ5B5N4ayeH7oJKem+ujutulBjy2eTfe1a14fI3lp9nirjrzXIa\nO5Usi729ETtQOn2NjNdT7L0Y1LmOBT2Y0dKIt3PClpGrHBpW1hM6qJ+ZrXFEKadz\nWXU3ulKtkMM44xVqmrySORFaC5r+mCsaohDLVjKCBUpMTy/6shic+LvRpls8eaov\nJNrM41Ak6Rlh4t8qQFbaB1KX1XxCkPDIl/oQIZWFv3yuV9OGzIn/i5RPwQLxOvHJ\nevnxwfx0Zm2vY+xKvqHumwR0giRaAIbjJUixOqAbQQKBgQDfI1UntzjRfnqUqmta\nzcqmmvH3zRNSBXvdrLijblrCPp31eQAKUXmarhU+zm9I1kRjGX1zLy07kEEdI4gy\nvG09XmPoQBebIp/qxU0jnWb9qnpkItDzz9R+NBsTgppxVVbDurboI9w8JUS+b9/l\n86eW8Ziwv90sOQK+nYDXRgesJQKBgQDIab8qiZtyFlnNQGB5y5YKxxvrkeZhPM4p\nZb3P6ME05bJOvUlnICpvRMgTZ8E8v+Sx4KmlXqlEzr/88Hga5eYjOi0jYeUN+9qk\nWcKh7PEq1VLVm/WWF6hAKmFj1+EidZtc/xCXVaFZq9ZHVrHwrF132TN5W3W6ZCED\n5pfi8KVbwQKBgCdqvWszoZTYS90hMa+rtMWzj1Tf5C7UCyqAjWlJYDz6BLtNMaWg\n+ONLJzOeEeiC+TesVA3Z4pqoA+ia0z9rK7zwhKONVt4vwqIdUmAdOQlMaSxxPgoj\nx3y3xaSvqIqmsZoHzLG7S/dP+hHN/3ZGkW9HpFpsuixKseJsPktI8qgFAoGBAMS4\nD94oLn4A9GrlOw2ySXgQ0xYbI2Dk95Ro+rT+yc8rfCeP42Inj5+iiyWJHYOM9GWp\nmbvqPAp/SrJ0M+BrM8f2TeJCMDzWr1nNhZ+93UfnFyT3rkuCszMwpmIDwEg72qGg\n+F8jvXowkud5cLZF6oU+nSkNHnUz3bhfe01WW2nBAoGAGwCfggWyR4vNYr1VxX85\n55qKdgrfTxjvbd+2tf72RFbQyniUPP1O5SJTuJ5AxSnnvhFVWUvbK2QnSL/ACw0u\n+cxzfd+Nfb3h0fUDeG0inUKo0EnBB2+Ro/1KWMNvWplagQp+IE0W6uAoYQo6jHXK\nldXZlgwcPJ6ADabbjG4ndHM=\n-----END PRIVATE KEY-----\n",
  client_email: "testsheet@project-api-gg-map.iam.gserviceaccount.com",
  client_id: "111987754353765416486",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/testsheet%40project-api-gg-map.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const auth = new google.auth.GoogleAuth({
  credentials: credentials, // Thay vì dùng keyFile, sử dụng credentials trực tiếp
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Helper function for logging
const logCheck = async (userId, description, table) => {
  try {
    // Ghi log vào Supabase
    const { error } = await supabase
      .from(table)
      .insert([{ staff_id: userId, description }]);

    if (error) {
      throw new Error(`Log Error: ${error.message}`);
    }
  } catch (err) {
    console.error(`Failed to insert log into table ${table}:`, err.message);
    throw new Error(err.message);
  }

  try {
    // Lấy ngày giờ hiện tại
    const datenow = new Date();

    // Xác thực với Google Sheets API
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const spreadsheetId = "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0";
    const sheetRange = "sheet2!A2:C";

    const logEntry = [[userId, description, datenow.toLocaleString()]];

    const request = {
      spreadsheetId: spreadsheetId,
      range: sheetRange,
      valueInputOption: "RAW",
      resource: {
        values: logEntry,
      },
    };

    await sheets.spreadsheets.values.append(request);
    console.log("Log đã được ghi vào Google Sheet:", description);
  } catch (error) {
    console.error("Lỗi khi ghi log vào Google Sheet:", error.message);
  }
};

async function writeScoreToSheet(userId, score, date, month) {
  const sheets = google.sheets("v4");

  const sheetName = `Thang_${month}`;

  try {
    // Tìm hàng chứa mã nhân viên
    const { data } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A2:A1000`, // Giới hạn tìm kiếm
    });

    const rows = data.values;
    let employeeRow = -1;

    // Tìm hàng mã nhân viên
    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === userId) {
          employeeRow = i + 2; // Hàng đầu tiên của A2
          break;
        }
      }
    }

    if (employeeRow === -1) {
      console.error("Không tìm thấy mã nhân viên trong sheet.");
      return;
    }

    // Hàm chuyển số thành ký tự cột (AA, AB,...)
    function getColumnLetter(colIndex) {
      let letter = "";
      while (colIndex >= 0) {
        letter = String.fromCharCode((colIndex % 26) + 65) + letter;
        colIndex = Math.floor(colIndex / 26) - 1;
      }
      return letter;
    }

    // Tính toán ký tự cột dựa vào ngày trong tháng, bắt đầu từ C (cột thứ 3)
    const columnLetter = getColumnLetter(2 + date - 1);

    // Xác định ô đích để ghi điểm
    const range = `${sheetName}!${columnLetter}${employeeRow}`;

    // Ghi điểm vào ô tương ứng
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [[score]], // Ghi điểm vào ô
      },
    });

    console.log(`Ghi điểm ${score} vào ${range} thành công.`);
  } catch (error) {
    console.error("Error writing score to sheet:", error);
  }
}

async function writecurrentresume(userId, score) {
  const sheets = google.sheets("v4");
  const sheetName = "sheet1";

  try {
    // Lấy tiêu đề các cột và dữ liệu trong Sheet1
    const { data: headerData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A1:Z1`, // Giới hạn tiêu đề từ A đến Z
    });

    const headers = headerData.values[0];
    const usedLeaveColumnIndex = headers.indexOf("Phép đã dùng");

    if (usedLeaveColumnIndex === -1) {
      console.error("Không tìm thấy cột 'Phép đã dùng' trong Sheet1.");
      return;
    }

    // Tìm hàng chứa mã nhân viên (MaChamCong)
    const { data: employeeData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!B2:B1000`, // Giới hạn tìm kiếm mã nhân viên trong cột "MaChamCong"
    });

    const rows = employeeData.values;
    let employeeRow = -1;

    // Tìm hàng có MaChamCong khớp với userId
    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] == userId) {
          // Kiểm tra điều kiện mã nhân viên khớp
          employeeRow = i + 2; // Hàng đầu tiên từ A2
          break;
        }
      }
    }

    if (employeeRow === -1) {
      console.error("Không tìm thấy mã nhân viên trong Sheet1.");
      return;
    }

    // Tính ký tự cột "Phép đã dùng" dựa vào chỉ số của nó
    function getColumnLetter(colIndex) {
      let letter = "";
      while (colIndex >= 0) {
        letter = String.fromCharCode((colIndex % 26) + 65) + letter;
        colIndex = Math.floor(colIndex / 26) - 1;
      }
      return letter;
    }

    const columnLetter = getColumnLetter(usedLeaveColumnIndex);
    const range = `${sheetName}!${columnLetter}${employeeRow}`;

    // Ghi điểm vào ô "Phép đã dùng" cho nhân viên
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [[score]],
      },
    });

    console.log(`Ghi điểm ${score} vào ${range} trong Sheet1 thành công.`);
  } catch (error) {
    console.error("Error writing score to Sheet1:", error);
  }
}

// Helper function for logging
const logCheckout = async (userId, description, table) => {
  try {
    // Ghi log vào Supabase
    const { error } = await supabase
      .from(table)
      .insert([{ staff_id: userId, description }]);

    if (error) {
      throw new Error(`Log Error: ${error.message}`);
    }
  } catch (err) {
    console.error(`Failed to insert log into table ${table}:`, err.message);
    throw new Error(err.message);
  }

  try {
    // Lấy ngày giờ hiện tại
    const datenow = new Date();

    // Xác thực với Google Sheets API
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const spreadsheetId = "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0";
    const sheetRange = "sheet2!G2:I";

    const logEntry = [[userId, description, datenow.toLocaleString()]];

    const request = {
      spreadsheetId: spreadsheetId,
      range: sheetRange,
      valueInputOption: "RAW",
      resource: {
        values: logEntry,
      },
    };

    await sheets.spreadsheets.values.append(request);
    console.log("Log đã được ghi vào Google Sheet:", description);
  } catch (error) {
    console.error("Lỗi khi ghi log vào Google Sheet:", error.message);
  }
};

// Hàm tính khoảng cách giữa hai tọa độ địa lý
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách tính bằng km
}

async function getOfficeLocations() {
  try {
    const { data, error } = await supabase
      .from("location")
      .select("latitude, longitude");

    if (error) {
      throw new Error(`Lỗi truy vấn dữ liệu: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Không có dữ liệu từ bảng location");
    }

    return data.map((location) => ({
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  } catch (error) {
    console.error("Lỗi khi lấy vị trí từ bảng location:", error);
    return [];
  }
}

async function checkAttendanceLocation(userLat, userLon) {
  const officeLocations = await getOfficeLocations();

  if (officeLocations.length === 0) {
    console.log("Không thể lấy dữ liệu vị trí văn phòng.");
    return false;
  }

  for (const location of officeLocations) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      userLat,
      userLon
    );

    if (distance <= 0.2) {
      console.log("Khoảng cách hợp lệ với một địa điểm, cho phép chấm công.");
      return true;
    }
  }

  console.log(
    "Khoảng cách quá 200m với tất cả địa điểm, không cho phép chấm công."
  );
  return false;
}

// Check-in
exports.checkIn = async (req, res) => {
  const userId = req.user.userId;
  const { Latitude, Longitude } = req.body;

  const isWithinRange = await checkAttendanceLocation(Latitude, Longitude);
  if (!isWithinRange) {
    return res
      .status(403)
      .json({ message: "Bạn đang ở ngoài phạm vi cho phép để chấm công." });
  }
  const datenow = new Date();

  const date = datenow.getDate();
  const month = datenow.getMonth() + 1;
  const year = datenow.getFullYear();

  const hours = datenow.getHours();
  const minutes = datenow.getMinutes();
  const seconds = datenow.getSeconds();

  const time = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const place = Longitude + "," + Latitude;
  const { error } = await supabase.from("attend").insert([
    {
      date,
      month,
      year,
      checkin_time: time,
      checkout_time: null,
      description: "Chấm công",
      id_staff: userId,
      id_status: 1,
      long_lat_checkin: place,
      long_lat_checkout: null,
    },
  ]);

  if (error) {
    await logCheck(userId, `Check-in failed: ${error.message}`, "logcheckin");
    return res.status(500).json({ error: error.message });
  }

  await logCheck(userId, "Check-in successful", "logcheckin");
  res.json({ message: "Success", time: getCurrentTimeCheckInCheckOut() });
};

function parseDate(dateInput) {
  if (typeof dateInput === "string") {
    const [year, month, day] = dateInput.split("-").map(Number);
    return new Date(year, month - 1, day);
  } else if (dateInput instanceof DateTime) {
    return dateInput.toJSDate();
  } else if (dateInput instanceof Date) {
    return dateInput;
  } else {
    throw new Error("Dữ liệu không hợp lệ, chỉ nhận DateTime hoặc string");
  }
}

async function calculateScore(
  id,
  checkin_time,
  checkout_time,
  dateString,
  idsettingtime
) {
  console.log("dateString", dateString); // Kiểm tra giá trị ngày tháng

  const date = parseDate(dateString); // Chuyển đổi về Date Object
  console.log("date", date); // Kiểm tra giá trị ngày tháng

  const isSaturday = date.getDay() === 6; // Kiểm tra có phải Thứ 7 hay không
  console.log("isSaturday", isSaturday); // Kiểm tra giá trị ngày tháng
  const { checkin_setting, checkout_setting } = id
    ? await getSettingTimeResume(id)
    : await getSettingTime(idsettingtime);

  const adjustedCheckoutSetting = isSaturday ? "12:00:00" : checkout_setting;

  if (!checkin_time || !checkout_time) {
    return "N/A"; // Thiếu dữ liệu check-in/check-out
  }

  const timeToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds + 60;
  };

  let checkinInSeconds = timeToSeconds(checkin_time);
  const checkoutInSeconds = timeToSeconds(checkout_time);
  let settingCheckinInSeconds = timeToSeconds(checkin_setting);
  const settingCheckoutInSeconds = timeToSeconds(adjustedCheckoutSetting);

  settingCheckinInSeconds += 60;

  const morningEndInSeconds = 12 * 3600; // 12:00:00
  const afternoonStartInSeconds = 13 * 3600; // 13:00:00

  // Điều chỉnh giờ check-in nếu sớm hơn giờ quy định
  if (checkinInSeconds < settingCheckinInSeconds) {
    checkinInSeconds = settingCheckinInSeconds;
  }

  let morningWork = 0;
  let afternoonWork = 0;

  // Tính công buổi sáng
  if (checkinInSeconds < morningEndInSeconds) {
    const morningCheckout = Math.min(checkoutInSeconds, morningEndInSeconds);
    morningWork = Math.max(0, morningCheckout - checkinInSeconds); // Thời gian làm việc buổi sáng
  }

  // Tính công buổi chiều
  if (checkoutInSeconds > afternoonStartInSeconds) {
    const afternoonCheckin = Math.max(
      checkinInSeconds,
      afternoonStartInSeconds
    );
    const afternoonCheckout = Math.min(
      checkoutInSeconds,
      settingCheckoutInSeconds
    );
    afternoonWork = Math.max(0, afternoonCheckout - afternoonCheckin); // Thời gian làm việc buổi chiều
  }

  // Tính tổng công
  let score = 0;

  if (isSaturday) {
    const maxMorningQuota = morningEndInSeconds - settingCheckinInSeconds;
    if (morningWork >= maxMorningQuota) {
      score = 1.0;
    } else {
      score = morningWork / maxMorningQuota;
    }
  } else {
    // Ngày thường: tính công buổi sáng và chiều
    const morningQuota = morningEndInSeconds - settingCheckinInSeconds;
    const afternoonQuota = settingCheckoutInSeconds - afternoonStartInSeconds;

    const morningScore =
      morningQuota > 0 ? (morningWork / morningQuota) * 0.5 : 0;
    const afternoonScore =
      afternoonQuota > 0 ? (afternoonWork / afternoonQuota) * 0.5 : 0;

    score = morningScore + afternoonScore;
  }
  score = Math.max(0, Math.min(score, 1.0));

  return score.toFixed(3);
}

async function calculatortime(id, checkin_time, checkout_time, idsettingtime) {
  if (!id) {
    const { checkin_setting, checkout_setting } = await getSettingTime(
      idsettingtime
    );

    if (!checkin_time || !checkout_time) {
      return "N/A"; // Trả về N/A nếu thiếu thời gian
    }

    const [checkinHours, checkinMinutes, checkinSeconds] = checkin_time
      .split(":")
      .map(Number);
    const [checkoutHours, checkoutMinutes, checkoutSeconds] = checkout_time
      .split(":")
      .map(Number);

    const [settingCheckinHours, settingCheckinMinutes, settingCheckinSeconds] =
      checkin_setting.split(":").map(Number);
    const [
      settingCheckoutHours,
      settingCheckoutMinutes,
      settingCheckoutSeconds,
    ] = checkout_setting.split(":").map(Number);

    const checkinInSeconds =
      checkinHours * 3600 + checkinMinutes * 60 + checkinSeconds;
    let checkoutInSeconds =
      checkoutHours * 3600 + checkoutMinutes * 60 + checkoutSeconds;
    const settingCheckinInSeconds =
      settingCheckinHours * 3600 +
      settingCheckinMinutes * 60 +
      settingCheckinSeconds;
    const settingCheckoutInSeconds =
      settingCheckoutHours * 3600 +
      settingCheckoutMinutes * 60 +
      settingCheckoutSeconds;

    if (checkoutInSeconds > settingCheckoutInSeconds) {
      checkoutInSeconds = settingCheckoutInSeconds;
    }

    const workedInSeconds = checkoutInSeconds - checkinInSeconds;

    const hours = Math.floor(workedInSeconds / 3600);
    const minutes = Math.floor((workedInSeconds % 3600) / 60);
    const seconds = workedInSeconds % 60;

    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  } else {
    const { checkin_setting, checkout_setting } = await getSettingTimeResume(
      id
    );

    if (!checkin_time || !checkout_time) {
      return "N/A"; // Trả về N/A nếu thiếu thời gian
    }

    const [checkinHours, checkinMinutes, checkinSeconds] = checkin_time
      .split(":")
      .map(Number);
    const [checkoutHours, checkoutMinutes, checkoutSeconds] = checkout_time
      .split(":")
      .map(Number);

    const [settingCheckinHours, settingCheckinMinutes, settingCheckinSeconds] =
      checkin_setting.split(":").map(Number);
    const [
      settingCheckoutHours,
      settingCheckoutMinutes,
      settingCheckoutSeconds,
    ] = checkout_setting.split(":").map(Number);

    const checkinInSeconds =
      checkinHours * 3600 + checkinMinutes * 60 + checkinSeconds;
    let checkoutInSeconds =
      checkoutHours * 3600 + checkoutMinutes * 60 + checkoutSeconds;
    const settingCheckinInSeconds =
      settingCheckinHours * 3600 +
      settingCheckinMinutes * 60 +
      settingCheckinSeconds;
    const settingCheckoutInSeconds =
      settingCheckoutHours * 3600 +
      settingCheckoutMinutes * 60 +
      settingCheckoutSeconds;

    if (checkoutInSeconds > settingCheckoutInSeconds) {
      checkoutInSeconds = settingCheckoutInSeconds;
    }

    const workedInSeconds = checkoutInSeconds - checkinInSeconds;

    const hours = Math.floor(workedInSeconds / 3600);
    const minutes = Math.floor((workedInSeconds % 3600) / 60);
    const seconds = workedInSeconds % 60;

    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  }
}

async function getSettingTime(id) {
  try {
    const { data, error } = await supabase
      .from("setting_time")
      .select("checkin_time, checkout_time")
      .eq("id_settingtime", id);

    if (error) {
      throw new Error(`Query Error: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data found in setting_time table");
    }

    return {
      checkin_setting: data[0].checkin_time,
      checkout_setting: data[0].checkout_time,
    };
  } catch (error) {
    console.error("Error fetching time settings:", error);
    return {
      checkin_setting: "08:00:00", // Default value if error occurs
      checkout_setting: "17:00:00",
    };
  }
}

async function getSettingTimeResume(id) {
  try {
    let bd, kt;

    // Truy vấn từ bảng `setting_resume`
    const { data, error } = await supabase
      .from("setting_resume")
      .select("starttime, endtime")
      .eq("id_setting_resume", id); // Dùng limit thay vì single để tránh lỗi nhiều dòng

    // Kiểm tra lỗi
    if (error) {
      console.error("Query Error:", error);
      throw new Error("Query failed: " + JSON.stringify(error));
    }

    // Nếu không có dữ liệu, trả về giá trị mặc định
    if (!data || data.length === 0) {
      console.warn("No data found in setting_resume table, using defaults.");
      return {
        checkin_setting: "08:00:00", // Giá trị mặc định
        checkout_setting: "17:00:00",
      };
    }

    // Lấy giá trị starttime và endtime
    const { starttime, endtime } = data[0];
    bd = starttime || "08:00:00"; // Nếu null, dùng giá trị mặc định
    kt = endtime || "17:00:00";

    // Trả về kết quả
    return {
      checkin_setting: bd,
      checkout_setting: kt,
    };
  } catch (error) {
    console.error("Error fetching time settingssss:", error);

    // Trả về giá trị mặc định khi có lỗi
    return {
      checkin_setting: "08:00:00",
      checkout_setting: "17:00:00",
    };
  }
}

// Hàm kiểm tra id_staff và ngày trong bảng resume
async function findResumeIdForStaff(userId, currentDate) {
  try {
    const { data, error } = await supabase
      .from("resume")
      .select("id_setting_resume, date_start, date_end")
      .eq("id_staff", userId)
      .eq("id_status", 2)
      .not("id_setting_resume", "in", "(1, 3, 4, 12, 13, 14, 17, 18, 19, 20)")
      .lte("date_start", currentDate)
      .gte("date_end", currentDate)
      .single();

    if (error) {
      console.error("Error fetching resume data:", error.message);
      return null;
    }
    return data ? data.id_setting_resume : null;
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return null;
  }
}

// Check-out
exports.checkOut = async (req, res) => {
  const userId = req.user.userId;
  const { Latitude, Longitude } = req.body;

  const isWithinRange = await checkAttendanceLocation(Latitude, Longitude);
  if (!isWithinRange) {
    return res
      .status(403)
      .json({ message: "Bạn đang ở ngoài phạm vi cho phép để chấm công." });
  }

  const datenow = new Date();
  const currentDate = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
  const resumeId = await findResumeIdForStaff(userId, currentDate);

  const date = datenow.getDate();
  const month = datenow.getMonth() + 1;
  const year = datenow.getFullYear();

  // const hours = datenow.getHours();
  // const minutes = datenow.getMinutes();
  // const seconds = datenow.getSeconds();

  const datenows = DateTime.now().setZone("Asia/Ho_Chi_Minh");

  const time = datenows.toFormat("HH:mm:ss"); // Lấy giờ theo HH:mm:ss

  const { data: latestRecord, error: fetchError } = await supabase
    .from("attend")
    .select("*")
    .eq("id_staff", userId)
    .eq("date", date)
    .eq("month", month)
    .eq("year", year)
    .single();

  if (fetchError) {
    console.error("Error fetching attend record:", fetchError.message);
    await logCheckout(userId, "Error fetching attend record", "logcheckout");
    return res.status(500).json({ error: "Error fetching attend record" });
  }

  if (!latestRecord || latestRecord.length === 0) {
    await logCheckout(
      userId,
      "No active check-in found for check-out",
      "logcheckout"
    );
    return res.status(404).json({ error: "No active check-in found" });
  }

  // đổi lại tên hàm nếu cần thiết
  const { data: latestRecords, error: fetchErrors } = await supabase
    .from("staff")
    .select("*")
    .eq("id_staff", userId)
    .single();

  if (fetchErrors) {
    console.error("Error fetching attend record:", fetchError.message);
    await logCheckout(userId, "Error fetching attend record", "logcheckout");
    return res.status(500).json({ error: "Error fetching attend record" });
  }

  if (!latestRecords || latestRecords.length === 0) {
    await logCheckout(
      userId,
      "No active check-in found for check-out",
      "logcheckout"
    );
    return res.status(404).json({ error: "No active check-in found" });
  }

  const attendId = latestRecord.id_attend;
  const checkin = latestRecord.checkin_time;
  let currentscore = latestRecord.point_attandance;
  if (currentscore === null) {
    currentscore = 0;
  }

  const scorecal = await calculateScore(
    resumeId,
    checkin,
    time,
    currentDate,
    latestRecords.id_time
  );
  // đánh dấu
  const scocetime = await calculatortime(
    resumeId,
    checkin,
    time,
    latestRecords.id_time
  );
  let score = Number(currentscore) + Number(scorecal);
  if (score > 1) {
    score = 1;
  }

  const { error: updateError } = await supabase
    .from("attend")
    .update({
      checkout_time: time,
      long_lat_checkout: Longitude + "," + Latitude,
      point_attandance: score,
    })
    .eq("id_attend", attendId);

  if (updateError) {
    console.error("Error updating checkout time:", updateError.message);
    await logCheckout(userId, "Error updating checkout time", "logcheckout");
    return res.status(500).json({ error: "Error updating checkout time" });
  }

  await writeScoreToSheet(userId, score, date, month); // Ghi điểm vào sheet

  // Ghi log checkout thành công
  await logCheckout(userId, "Check-out successful", "logcheckout");
  return res.json({
    message: "Success",
    time: getCurrentTimeCheckInCheckOut(),
    score: score,
    scocetime: scocetime,
  });
};

// Change Password
exports.changePassword = async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    // Fetch user details from Supabase
    const { data: userResult, error: userError } = await supabase
      .from("staff")
      .select("password")
      .eq("id_staff", userId)
      .single(); // Get a single user

    if (userError || !userResult) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, userResult.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không chính xác" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update the password in Supabase
    const { error: updateError } = await supabase
      .from("staff")
      .update({ password: hashedPassword })
      .eq("id_staff", userId);

    if (updateError) {
      throw new Error("Error updating password");
    }

    res.status(200).json({ message: "Password thay đổi thành công" });
  } catch (err) {
    console.error("Error during password change:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { userId } = req.body;

  try {
    // Fetch user details from Supabase
    const { data: userResult, error: userError } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single(); // Get a single user

    if (userError || !userResult) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    let newpass = "123123123";
    // Hash new password
    const hashedPassword = await bcrypt.hash(newpass, 10);
    // Update the password in Supabase
    const { error: updateError } = await supabase
      .from("staff")
      .update({ password: hashedPassword })
      .eq("id_staff", userId);

    if (updateError) {
      throw new Error("Error updating password");
    }
    sendnotify(
      userResult.token_notification,
      "Thông báo mật khẩu",
      "Mật khẩu của bạn đã trở về mặc định \nMật khẩu của bạn là : " + newpass
    );

    res.status(200).json({ message: "Password thay đổi thành công" });
  } catch (err) {
    console.error("Error during password change:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Change user profile
exports.changeProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, sologan } = req.body;

  try {
    const { error } = await supabase
      .from("staff")
      .update({ name: name, sologan: sologan })
      .eq("id_staff", userId);

    if (error) {
      throw new Error("Error updating profile");
    }

    res.status(201).json({ message: "Cập nhật hồ sơ thành công" });
    return res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change avatar
exports.changeProfileAvatar = async (req, res) => {
  const userId = req.user.userId;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ error: "No avatar provided" });
  }

  try {
    const buffer = Buffer.from(avatar, "base64");

    const result = await uploadToCloudinary(buffer);

    const avatarUrl = result.secure_url;

    const { error } = await supabase
      .from("staff")
      .update({ avatar: avatarUrl })
      .eq("id_staff", userId);

    if (error) {
      throw new Error("Error updating avatar in database");
    }

    res.status(201).json({ message: "Cập nhật avatar thành công", avatarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance by month
exports.getAttendanceByMonth = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.body;

  try {
    const { data: results, error } = await supabase
      .from("attend")
      .select("*")
      .eq("id_staff", userId)
      .eq("month", month)
      .eq("year", year);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }

    res.status(200).json({ attendance: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceByUserDateNow = async (req, res) => {
  const userId = req.user.userId;
  const { date, month, year } = req.body;

  try {
    const { data: results, error } = await supabase
      .from("attend")
      .select("*")
      .eq("id_staff", userId)
      .eq("date", date)
      .eq("month", month)
      .eq("year", year);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }
    const datenow = new Date();
    const currentDate = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh

    const resumeId = await findResumeIdForStaff(userId, currentDate);

    // đổi lại tên hàm nếu cần thiết
    const { data: latestRecords, error: fetchErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (fetchErrors) {
      console.error("Error fetching attend record:", fetchError.message);
      await logCheckout(userId, "Error fetching attend record", "logcheckout");
      return res.status(500).json({ error: "Error fetching attend record" });
    }

    if (!latestRecords || latestRecords.length === 0) {
      await logCheckout(
        userId,
        "No active check-in found for check-out",
        "logcheckout"
      );
      return res.status(404).json({ error: "No active check-in found" });
    }

    const scocetime = await calculatortime(
      resumeId,
      results[0].checkin_time,
      results[0].checkout_time,
      latestRecords.id_time
    );

    // Tính thời gian làm việc cho từng bản ghi
    const attendanceWithDuration = results.map((record) => {
      const checkin = dayjs(record.checkintime);
      const checkout = dayjs(record.checkouttime);

      // Tính toán thời gian làm việc
      const totalDuration = dayjs.duration(checkout.diff(checkin));

      return {
        ...record,
        workingTime: {
          hours: totalDuration.hours(),
          minutes: totalDuration.minutes(),
          seconds: totalDuration.seconds(),
        },
      };
    });
    const { data: resultss, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: error.message });
    }

    // Phản hồi thành công với cả danh sách và thời gian làm việc
    res.status(200).json({
      user: resultss,
      attendanceRecords: results,
      attendanceWithDuration,
      scocetime: scocetime,
    });
  } catch (err) {
    res.status(500).json({ error: "Unexpected server error" });
  }
};

// Get attendance for user
exports.getAttendanceByUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data: results, error } = await supabase
      .from("attend")
      .select(
        `
      *,
      staff(name)
    `
      )
      .eq("id_staff", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }

    res.status(200).json({ attendance: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get attendance by month
exports.getAttendanceByMonthOfAdmin = async (req, res) => {
  const { userId, month, year } = req.query;

  try {
    const { data: results, error } = await supabase
      .from("attend")
      .select("*")
      .eq("id_staff", userId)
      .eq("month", month)
      .eq("year", year);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }

    res.status(200).json({ attendance: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get information user
exports.getInfoUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data: results, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin nhân viên" });
    }

    const { data: resultss, errors } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", results[0].role_id);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: timeSettings, error: errorSettings } = await supabase
      .from("setting_time")
      .select("*")
      .eq("id_settingtime", results[0].id_time)
      .single();
    if (errorSettings) {
      return res.status(500).json({ error: errorSettings.message });
    }
    res
      .status(200)
      .json({
        attendance: results,
        role: resultss,
        time_settings: timeSettings,
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get attendance by user
exports.getAttendanceByUserOfAdmin = async (req, res) => {
  const { userId } = req.query;

  try {
    const { data: results, error } = await supabase
      .from("attend")
      .select("*")
      .eq("id_staff", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }

    res.status(200).json({ attendance: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get attendance for all users
exports.getAttendanceByAllUserOfAdmin = async (req, res) => {
  let userId = req.user.userId;
  const userName = req.user.userName;

  try {
    const datenow = new Date();

    const month = datenow.getMonth() + 1;
    const year = datenow.getFullYear();

    // Bắt đầu truy vấn với cấu trúc cơ bản
    let query = supabase
      .from("attend")
      .select(
        `*, staff:id_staff(id_staff, name, manager), status:id_status(id_status, name_status)`
      )
      .eq("month", month)
      .eq("year", year)
      .order("id_attend", { ascending: false }); // Sắp xếp giảm dần theo cột id_attend

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("staff.manager", userName);
      }
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const filteredResults = results.filter(
      (item) => item.staff && item.staff.manager !== null
    );

    if (filteredResults.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu công phù hợp" });
    }

    res.status(200).json({ attendance: filteredResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceByMonthAllUserOfAdmin = async (req, res) => {
  let userId = req.user.userId;
  const userName = req.user.userName;
  const { month, year } = req.body;

  try {
    // Bắt đầu truy vấn với cấu trúc cơ bản
    let query = supabase
      .from("attend")
      .select(
        `*, staff:id_staff(id_staff, name, manager), status:id_status(id_status, name_status)`
      )
      .eq("month", month)
      .eq("year", year)
      .order("id_attend", { ascending: false }); // Sắp xếp giảm dần theo cột id_attend

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("staff.manager", userName);
      }
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const filteredResults = results.filter(
      (item) => item.staff && item.staff.manager !== null
    );

    if (filteredResults.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu công phù hợp" });
    }

    res.status(200).json({ attendance: filteredResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceByDateAllUserOfAdmin = async (req, res) => {
  let userId = req.user.userId;
  const userName = req.user.userName;
  const { date, month, year } = req.body;

  try {
    // Bắt đầu truy vấn với cấu trúc cơ bản
    let query = supabase
      .from("attend")
      .select(
        `*, staff:id_staff(id_staff, name, manager), status:id_status(id_status, name_status)`
      )
      .eq("date", date)
      .eq("month", month)
      .eq("year", year)
      .order("id_attend", { ascending: false }); // Sắp xếp giảm dần theo cột id_attend

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("staff.manager", userName);
      }
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const filteredResults = results.filter(
      (item) => item.staff && item.staff.manager !== null
    );

    if (filteredResults.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu công phù hợp" });
    }

    res.status(200).json({ attendance: filteredResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByAdmin = async (req, res) => {
  const userId = req.user.userId;
  const userName = req.user.userName;
  const { month, year } = req.body;

  // Kiểm tra nếu month và year không được cung cấp
  if (!month || !year) {
    return res.status(400).json({ error: "Month and Year are required" });
  }

  try {
    // Bắt đầu truy vấn cơ bản
    let query = supabase
      .from("staff")
      .select(
        `
        id_staff,
        name,
        attend(
          month,
          year,
          date,
          point_attandance
        )
      `
      )
      .neq("id_staff", "NV000")
      .eq("attend.month", month) // Lọc theo tháng
      .eq("attend.year", year); // Lọc theo năm

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("staff.manager", userName);
      }
    }

    // Thực hiện truy vấn và xử lý kết quả
    const { data: results, error } = await query;

    // Kiểm tra lỗi trong quá trình truy vấn
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Nếu không có kết quả nào
    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản công nào" });
    }

    // Trả kết quả về cho client
    res.status(200).json({ user: results });
  } catch (err) {
    // Xử lý lỗi nếu có
    res.status(500).json({ error: err.message });
  }
};

// Get location
exports.getLocation = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("location")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy vị trí" });
    }

    res.status(200).json({ locations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get staff for Admin
exports.staffForAdmin = async (req, res) => {
  const userId = req.user.userId;
  const userName = req.user.userName;

  try {
    let query = supabase
      .from("staff")
      .select("*, role:role_id(name_role)")
      .eq("status", true);

    if (userId !== "NV000") {
      query = query.or(`manager.eq.${userName}`);
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ staff: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stafffalseForAdmin = async (req, res) => {
  const userId = req.user.userId;
  const userName = req.user.userName;

  try {
    let query = supabase
      .from("staff")
      .select("*, role:role_id(name_role)")
      .eq("status", false);

    if (userId !== "NV000") {
      query = query.or(`manager.eq.${userName}`);
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ staff: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get log-login for Admin
exports.logloginForAdmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("loglogin")
      .select("*, staff:staff_id ( id_staff,name,email )");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy log" });
    }
    res.status(200).json({ loglogin: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get log-register for Admin
exports.logregisterForAdmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("logregister")
      .select("*, staff:staff_id ( id_staff,name,email )");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy log" });
    }

    res.status(200).json({ logregister: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get log-checkin for Admin
exports.logcheckinForAdmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("logcheckin")
      .select("*, staff:staff_id ( id_staff,name,email )");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy log" });
    }

    res.status(200).json({ logcheckin: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get log-checkou for Admin
exports.logcheckoutForAdmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("logcheckout")
      .select("*, staff:staff_id ( id_staff,name,email )");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy log" });
    }

    res.status(200).json({ logcheckout: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get timesetting for admin
exports.timeSetting = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("setting_time")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thời gian hệ thống" });
    }

    res.status(200).json({ setting_time: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSettingTime = async (req, res) => {
  const { checkin_setting, checkout_setting } = req.body;

  const updateData = {};
  if (checkin_setting) updateData.checkin_time = checkin_setting;
  if (checkout_setting) updateData.checkout_time = checkout_setting;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ message: "Dữ liệu không phù hợp để cập nhật" });
  }

  try {
    const { data, error } = await supabase
      .from("setting_time")
      .update(updateData)
      .eq("id_settingtime", 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res
      .status(200)
      .json({ message: "Hệ thống thời gian cập nhật thành công", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get location for admin
exports.locationSetting = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("location")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy vị trí" });
    }

    res.status(200).json({ location: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertSettingLocation = async (req, res) => {
  const { id_location, latInput, lonPattern, name } = req.body;

  // Kiểm tra yêu cầu dữ liệu
  if (!id_location || !name || !latInput || !lonPattern) {
    return res.status(400).json({
      message: "Một trong số các dữ liệu không phù hợp",
    });
  }

  const insertData = {};
  insertData.latitude = latInput;
  insertData.longitude = lonPattern;
  insertData.name_location = name;
  insertData.id_location = id_location;

  try {
    // Kiểm tra xem id_location đã tồn tại trong bảng "location" hay chưa
    const { data: existingLocation, error: checkError } = await supabase
      .from("location")
      .select("id_location")
      .eq("id_location", id_location);

    if (checkError) {
      console.error("Error checking location:", checkError);
      return res.status(500).json({ error: checkError.message });
    }

    if (existingLocation.length > 0) {
      // Nếu id_location đã tồn tại, trả về lỗi
      return res.status(400).json({ message: "Vị trí đã tồn tại" });
    }

    // Insert dữ liệu vào Supabase
    const { data, error } = await supabase
      .from("location")
      .insert([insertData]);

    if (error) {
      console.error("Error inserting location:", error);
      return res.status(500).json({ error: error.message });
    }

    // Gọi hàm để ghi vào Google Sheets với thông tin mới
    await locationsettinginsert(id_location, name, lonPattern, latInput);

    // Trả về kết quả thành công
    res.status(200).json({ message: "Vị trí cập nhật thành công", data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
};

async function locationsettinginsert(userId, name, long, lat) {
  const sheets = google.sheets("v4");
  const sheetName = "location_setting";

  try {
    // Lấy các tiêu đề cột để xác định vị trí của từng cột
    const { data: headerData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headerData.values[0];
    const nameColumnIndex = headers.indexOf("Tên trụ sở"); // Cột "Tên trụ sở" nằm ở B
    const longitudeColumnIndex = headers.indexOf("Longitude"); // Cột "Longitude" nằm ở C
    const latitudeColumnIndex = headers.indexOf("Latitude"); // Cột "Latitude" nằm ở D

    if (
      nameColumnIndex === -1 ||
      longitudeColumnIndex === -1 ||
      latitudeColumnIndex === -1
    ) {
      console.error(
        "Không tìm thấy cột 'Tên trụ sở', 'Longitude' hoặc 'Latitude' trong Sheets."
      );
      return;
    }

    // Chèn dòng mới vào Google Sheets
    const newRow = [
      userId, // Mã trụ sở
      name, // Tên trụ sở
      long, // Longitude
      lat, // Latitude
    ];

    // Thêm dòng mới vào Google Sheets
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A2:D2`, // Chèn từ hàng 2 trở đi
      valueInputOption: "RAW",
      resource: {
        values: [newRow],
      },
    });

    console.log(`Đã thêm mới thông tin vào Google Sheets: ${newRow}`);
  } catch (error) {
    console.error("Error inserting location data into Google Sheets:", error);
  }
}

exports.updateSettingLocation = async (req, res) => {
  const { id_location, latInput, lonPattern, name } = req.body;

  const updateData = {};
  if (latInput) updateData.latitude = latInput;
  if (lonPattern) updateData.longitude = lonPattern;
  if (name) updateData.name_location = name;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ message: "Dữ liệu không phù hợp để cập nhật" });
  }

  try {
    // Cập nhật vào Supabase
    const { data, error } = await supabase
      .from("location")
      .update(updateData)
      .eq("id_location", id_location);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Gọi hàm để ghi vào Google Sheets với thông tin cập nhật
    await locationsettingupdate(id_location, name, lonPattern, latInput);

    res
      .status(200)
      .json({ message: "Vị trí hệ thống cập nhật thành công", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function locationsettingupdate(userId, name, long, lat) {
  const sheets = google.sheets("v4");
  const sheetName = "location_setting";

  try {
    // Lấy các tiêu đề cột để xác định vị trí của từng cột
    const { data: headerData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headerData.values[0];
    const nameColumnIndex = headers.indexOf("Tên trụ sở"); // Cột "Tên trụ sở" nằm ở B
    const longitudeColumnIndex = headers.indexOf("Longitude"); // Cột "Longitude" nằm ở C
    const latitudeColumnIndex = headers.indexOf("Latitude"); // Cột "Latitude" nằm ở D

    if (
      nameColumnIndex === -1 ||
      longitudeColumnIndex === -1 ||
      latitudeColumnIndex === -1
    ) {
      console.error(
        "Không tìm thấy cột 'Tên trụ sở', 'Longitude' hoặc 'Latitude' trong Sheets."
      );
      return;
    }

    const { data: employeeData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A2:A1000`,
    });

    const rows = employeeData.values;
    let employeeRow = -1;

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] == userId) {
          employeeRow = i + 2;
          break;
        }
      }
    }

    if (employeeRow === -1) {
      console.error("Không tìm thấy mã trụ sở trong Sheets.");
      return;
    }

    function getColumnLetter(colIndex) {
      let letter = "";
      while (colIndex >= 0) {
        letter = String.fromCharCode((colIndex % 26) + 65) + letter;
        colIndex = Math.floor(colIndex / 26) - 1;
      }
      return letter;
    }

    const nameColumnLetter = getColumnLetter(nameColumnIndex);
    const longitudeColumnLetter = getColumnLetter(longitudeColumnIndex);
    const latitudeColumnLetter = getColumnLetter(latitudeColumnIndex);

    const nameRange = `${sheetName}!${nameColumnLetter}${employeeRow}`;
    const longitudeRange = `${sheetName}!${longitudeColumnLetter}${employeeRow}`;
    const latitudeRange = `${sheetName}!${latitudeColumnLetter}${employeeRow}`;

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: nameRange,
      valueInputOption: "RAW",
      resource: {
        values: [[name]], // Ghi tên trụ sở
      },
    });

    // Cập nhật "Longitude"
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: longitudeRange,
      valueInputOption: "RAW",
      resource: {
        values: [[long]], // Ghi giá trị longitude
      },
    });

    // Cập nhật "Latitude"
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: latitudeRange,
      valueInputOption: "RAW",
      resource: {
        values: [[lat]], // Ghi giá trị latitude
      },
    });

    console.log(
      `Đã cập nhật Tên trụ sở, tọa độ vào ${nameRange}, ${longitudeRange}, và ${latitudeRange} thành công.`
    );
  } catch (error) {
    console.error("Error writing location update to Sheets:", error);
  }
}

exports.deleteSettingLocation = async (req, res) => {
  const { id_location } = req.body;

  if (!id_location) {
    return res.status(400).json({ message: "Không tìm thấy vị trí để xóa" });
  }

  try {
    // Xóa dữ liệu trong bảng "location" của Supabase
    const { data, error } = await supabase
      .from("location")
      .delete()
      .eq("id_location", id_location);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Xóa thông tin trong Google Sheets
    await locationsettingdelete(id_location);

    res.status(200).json({ message: "Xóa vị trí thành công", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hàm xóa thông tin từ Google Sheets
async function locationsettingdelete(id_location) {
  const sheets = google.sheets("v4");
  const sheetName = "location_setting";

  try {
    // Lấy các tiêu đề cột để xác định vị trí của từng cột
    const { data: headerData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headerData.values[0];
    const nameColumnIndex = headers.indexOf("Tên trụ sở"); // Cột "Tên trụ sở" nằm ở B
    const longitudeColumnIndex = headers.indexOf("Longitude"); // Cột "Longitude" nằm ở C
    const latitudeColumnIndex = headers.indexOf("Latitude"); // Cột "Latitude" nằm ở D

    if (
      nameColumnIndex === -1 ||
      longitudeColumnIndex === -1 ||
      latitudeColumnIndex === -1
    ) {
      console.error(
        "Không tìm thấy cột 'Tên trụ sở', 'Longitude' hoặc 'Latitude' trong Sheets."
      );
      return;
    }

    // Tìm hàng chứa mã trụ sở theo `id_location` trong cột A
    const { data: employeeData } = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: `${sheetName}!A2:A1000`, // Cột A chứa mã trụ sở
    });

    const rows = employeeData.values;
    let employeeRow = -1;

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] == id_location) {
          // Kiểm tra mã trụ sở khớp với `id_location`
          employeeRow = i + 2; // Lấy hàng tương ứng
          break;
        }
      }
    }

    if (employeeRow === -1) {
      console.error("Không tìm thấy mã trụ sở trong Sheets.");
      return;
    }

    // Xóa thông tin từ các cột tương ứng (A, B, C, D)
    const locationRange = `${sheetName}!A${employeeRow}:D${employeeRow}`;

    // Xóa thông tin ở các cột từ A đến D (Mã trụ sở, Tên trụ sở, Longitude, Latitude)
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: "1R1CYVSqv2W29qYvFnN-JKL5Ndvnc8_9tnw2tLEe3TX0",
      range: locationRange,
      valueInputOption: "RAW",
      resource: {
        values: [["", "", "", ""]], // Xóa giá trị của tất cả các cột từ A đến D
      },
    });

    console.log(`Đã xóa thông tin từ hàng ${employeeRow} thành công.`);
  } catch (error) {
    console.error("Error deleting location from Sheets:", error);
  }
}

exports.cancelStaffAccount = async (req, res) => {
  const roleId = req.user.roleId;
  const { staffId } = req.body;

  try {
    const { data: role, error: roleError } = await supabase
      .from("role")
      .select("staff_update")
      .eq("role_id", roleId);

    if (roleError) {
      return res.status(500).json({ error: roleError.message });
    }

    if (!role || role.staff_update === false) {
      return res
        .status(403)
        .json({ error: "Không có quyền cập nhật nhân viên" });
    }

    const { data, error } = await supabase
      .from("staff")
      .update({ status: false })
      .eq("id_staff", staffId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Hủy tài khoản thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelStaffIP = async (req, res) => {
  const { staffId } = req.body;
  const roleId = req.user.roleId;

  try {
    const { data: role, error: roleError } = await supabase
      .from("role")
      .select("staff_update")
      .eq("role_id", roleId);

    if (roleError) {
      return res.status(500).json({ error: roleError.message });
    }

    if (!role || role.staff_update === false) {
      return res
        .status(403)
        .json({ error: "Không có quyền cập nhật nhân viên" });
    }
    const { data, error } = await supabase
      .from("staff")
      .update({ description_ip: null })
      .eq("id_staff", staffId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Xóa liên kết thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoleAccount = async (req, res) => {
  const { staffId, roleId } = req.body;

  try {
    const { data, error } = await supabase
      .from("staff")
      .update({ role_id: roleId })
      .eq("id_staff", staffId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Xóa vị trí thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restoreStaffAccount = async (req, res) => {
  const { staffId } = req.body;

  const roleId = req.user.roleId;

  try {
    const { data: role, error: roleError } = await supabase
      .from("role")
      .select("staff_update")
      .eq("role_id", roleId);

    if (roleError) {
      return res.status(500).json({ error: roleError.message });
    }

    if (!role || role.staff_update === false) {
      return res
        .status(403)
        .json({ error: "Không có quyền cập nhật nhân viên" });
    }

    const { data, error } = await supabase
      .from("staff")
      .update({ status: true })
      .eq("id_staff", staffId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Hủy tài khoản thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get resume for Admin
exports.resume1ForAdmin = async (req, res) => {
  const userId = req.user.userId;
  const userName = req.user.userName;

  try {
    let query = supabase
      .from("resume")
      .select(
        `
      *,
      staff: id_staff (*),
      status_resume: id_status (*),
      setting_resume: id_setting_resume (*)
    `
      )
      .eq("id_status", 1); // Điều kiện chung cho tất cả

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("id_manager", userId);
      }
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resumeAllForAdmin = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data: results, error } = await supabase
      .from("resume")
      .select(
        `
        *,
        staff: id_staff (*),
        status_resume: id_status (*),
        setting_resume: id_setting_resume (*)
      `
      )
      .eq("id_manager", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resume2ForAdmin = async (req, res) => {
  const userId = req.user.userId;

  try {
    let query = supabase
      .from("resume")
      .select(
        `
      *,
      staff: id_staff (*),
      status_resume: id_status (*),
      setting_resume: id_setting_resume (*)
    `
      )
      .eq("id_status", 2); // Điều kiện chung cho tất cả

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("id_manager", userId);
      }
    }

    const { data: results, error: queryError } = await query;

    if (queryError) {
      return res.status(500).json({ error: queryError.message });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resume3ForAdmin = async (req, res) => {
  const userId = req.user.userId;
  const userName = req.user.userName;

  try {
    let query = supabase
      .from("resume")
      .select(
        `
      *,
      staff: id_staff (*),
      status_resume: id_status (*),
      setting_resume: id_setting_resume (*)
    `
      )
      .eq("id_status", 3); // Điều kiện chung cho tất cả

    const { data: role, errors } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (errors) {
      return res.status(500).json({ error: errors.message });
    }
    const { data: roles, errorss } = await supabase
      .from("role")
      .select("*")
      .eq("role_id", role[0].role_id);

    if (errorss) {
      return res.status(500).json({ error: errorss.message });
    }
    if (roles[0].name_role !== "Kế toán") {
      if (userId !== "NV000") {
        query = query.eq("id_manager", userId);
      }
    }

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelResume = async (req, res) => {
  // Kiểm tra xem nhận dữ liệu là mảng hay một đối tượng đơn
  const items = Array.isArray(req.body) ? req.body : [req.body]; // Chuyển dữ liệu thành mảng nếu là đối tượng đơn

  if (items.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để xử lý." });
  }

  try {
    const results = [];

    // Lặp qua từng item (resumeId, id_setting_resume)
    for (const item of items) {
      const { resumeId, id_setting_resume } = item;

      if (!resumeId) {
        return res.status(400).json({ error: "Thiếu resumeId trong một mục." });
      }

      // Cập nhật trạng thái đơn (resume)
      const { data, error } = await supabase
        .from("resume")
        .update({ id_status: 3 }) // Cập nhật trạng thái
        .eq("id_resume", resumeId)
        .select("id_staff, id_setting_resume, date_start, date_end");

      if (error) {
        console.error(`Lỗi xử lý resumeId ${resumeId}:`, error);
        results.push({ resumeId, success: false, error });
        continue; // Tiếp tục xử lý các phần tử tiếp theo trong mảng
      }

      // Lấy thông tin nhân viên từ bảng staff
      const { data: settingDatas, error: settingErrorss } = await supabase
        .from("staff")
        .select("*")
        .eq("id_staff", data[0].id_staff)
        .single();

      if (settingErrorss) {
        results.push({
          resumeId,
          success: false,
          error: settingErrorss.message,
        });
        continue;
      }

      if (!settingDatas) {
        results.push({
          resumeId,
          success: false,
          error: "Không tìm thấy nhân viên",
        });
        continue;
      }

      // Lấy thông tin quản lý từ bảng staff
      const { data: Datamanager, error: settingErrors } = await supabase
        .from("staff")
        .select("*")
        .eq("name", settingDatas.manager)
        .single();

      if (settingErrors) {
        results.push({
          resumeId,
          success: false,
          error: settingErrors.message,
        });
        continue;
      }

      if (!Datamanager) {
        results.push({
          resumeId,
          success: false,
          error: "Không tìm thấy quản lí",
        });
        continue;
      }

      // Lấy thông tin đơn từ bảng setting_resume
      const { data: resumesetting, error: settingErrorxs } = await supabase
        .from("setting_resume")
        .select("*")
        .eq("id_setting_resume", data[0].id_setting_resume)
        .single();

      if (settingErrorxs) {
        results.push({
          resumeId,
          success: false,
          error: settingErrorxs.message,
        });
        continue;
      }

      if (!resumesetting) {
        results.push({ resumeId, success: false, error: "Không tìm thấy đơn" });
        continue;
      }

      // Gửi thông báo và lưu notification
      sendnotify(
        settingDatas.token_notification,
        `Từ chối ${resumesetting.name_setting_resume}`,
        `Quản lí: ${Datamanager.name} vừa từ chối ${resumesetting.name_setting_resume}\nNgày bắt đầu: ${data[0].date_start}\nNgày kết thúc: ${data[0].date_end}`
      );
      savenotification(
        data[0].id_staff,
        `Từ chối ${resumesetting.name_setting_resume}`,
        `Quản lí: ${Datamanager.name} vừa từ chối ${resumesetting.name_setting_resume}\nNgày bắt đầu: ${data[0].date_start}\nNgày kết thúc: ${data[0].date_end}`,
        resumeId
      );

      // Thêm kết quả vào mảng
      results.push({
        resumeId,
        success: true,
        message: "Từ chối đơn thành công",
      });
    }

    // Trả về kết quả tổng hợp của từng đơn
    return res.status(200).json({ message: "Xử lý đơn thành công.", results });
  } catch (err) {
    console.error("Lỗi khi xử lý:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteResume = async (req, res) => {
  const { resumeId } = req.body;
  if (!resumeId) {
    return res.status(400).json({ error: "resumeId is required." });
  }
  try {
    const { data: settingDatass, error: settingErrorsss } = await supabase
      .from("resume")
      .select("*")
      .eq("id_resume", resumeId)
      .single();

    if (settingErrorsss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatass) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }
    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", settingDatass.id_staff)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", settingDatass.id_setting_resume);
    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Xóa ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa xóa " +
        resumesetting.name_setting_resume
    );
    savenotification(
      Datamanager.id_staff,
      `Xóa ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        Datamanager.name +
        " vừa xóa " +
        resumesetting.name_setting_resume,
      resumeId
    );

    const { data, error } = await supabase
      .from("resume")
      .delete()
      .eq("id_resume", resumeId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Xóa đơn thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume1 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    // Kiểm tra thông tin nhân viên
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (staffError) {
      return res.status(500).json({ error: staffError.message });
    }

    if (!staffData) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const limit = staffData.limit_resume_year;
    const current = staffData.current_resume;

    if (current >= limit) {
      return res
        .status(400)
        .json({ message: "Qúa giới hạn tạo đơn trong tháng hoặc năm" });
    }
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 1)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", staffData.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }
    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 1)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        staffData.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        staffData.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );
    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// user resume
exports.insertResume1 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    const { data: settingData, error: settingError } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    if (!settingData) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const limit = settingData.limit_resume_year;
    const current = settingData.current_resume;

    if (current >= limit) {
      return res
        .status(400)
        .json({ message: "Qúa giới hạn tạo đơn trong tháng hoặc năm" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingData.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 1)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 1,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // gửi thông báo
    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 1)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }
    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingData.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingData.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume2 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, starttime, endtime } =
    req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 2)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 2,
        description: description,
        id_status: 1,
        id_staff: userId,
        time_start: starttime,
        time_end: endtime,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end,time_start,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 2)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume2 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, starttime, endtime } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 2)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`)
      .or(`and(time_start.lte.${endtime},time_end.gte.${starttime})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày hoặc giờ đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 2,
          description: description,
          id_status: 1,
          id_staff: userId,
          time_start: starttime,
          time_end: endtime,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end,time_start,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 2)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resume3limit = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select(
        `
        *
      `
      )
      .eq("id_setting_resume", 3);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resume4limit = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select(
        `
        *
      `
      )
      .eq("id_setting_resume", 4);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume3 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 3)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .gte("date_start", dateStart)
        .lte("date_end", dateEnd);
      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      if (existingData && existingData.length > 0) {
        return res.status(400).json({
          message: "Ngày đang nằm trong khoảng đã có",
        });
      }
    }
    // Lấy giới hạn từ bảng setting_resume
    const { data: settingData, error: settingError } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 3)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    if (!settingData) {
      return res.status(404).json({ message: "Resume setting not found" });
    }

    const limit = settingData.limit_resume;

    // Lấy tháng và năm của dateStart
    const month = new Date(dateStart).getMonth() + 1;
    const year = new Date(dateStart).getFullYear();

    // Xác định khoảng thời gian đầu và cuối của tháng
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Kiểm tra số lượng bản ghi trong bảng resume của tháng và năm đó
    const { count, error: resumeError } = await supabase
      .from("resume")
      .select("*", { count: "exact", head: true })
      .eq("id_setting_resume", 3)
      .gte("date_end", startOfMonth)
      .lte("date_start", endOfMonth)
      .eq("id_status", 2)
      .eq("id_staff", userId);

    if (resumeError) {
      return res.status(500).json({ error: resumeError.message });
    }

    if (count >= limit) {
      return res
        .status(400)
        .json({ message: "Limit reached for this month and year." });
    }

    // Cập nhật bản ghi trong bảng resume
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 3,
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 3)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Resume updated successfully.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume3 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 3)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    // Lấy giới hạn từ bảng setting_resume
    const { data: settingData, error: settingError } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 3)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    if (!settingData) {
      return res.status(404).json({ message: "Resume setting not found" });
    }

    const limit = settingData.limit_resume;

    // Lấy tháng và năm của dateStart
    const month = new Date(dateStart).getMonth() + 1;
    const year = new Date(dateStart).getFullYear();

    // Xác định khoảng thời gian đầu và cuối của tháng
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Kiểm tra số lượng bản ghi trong bảng resume của tháng và năm đó
    const { count, error: resumeError } = await supabase
      .from("resume")
      .select("*", { count: "exact", head: true })
      .eq("id_setting_resume", 3)
      .gte("date_end", startOfMonth)
      .lte("date_start", endOfMonth)
      .in("id_status", [1, 2])
      .eq("id_staff", userId);

    if (resumeError) {
      return res.status(500).json({ error: resumeError.message });
    }

    if (count > limit) {
      return res
        .status(400)
        .json({ message: "Limit reached for this month and year." });
    }

    // Thực hiện thêm dữ liệu vào bảng resume
    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 3,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;

    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 3)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    console.log(resumeId);
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Resume inserted successfully.", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume4 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 4)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .gte("date_start", dateStart)
        .lte("date_end", dateEnd);
      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      if (existingData && existingData.length > 0) {
        return res.status(400).json({
          message: "Ngày đang nằm trong khoảng đã có",
        });
      }
    }
    // Lấy giới hạn từ bảng setting_resume
    const { data: settingData, error: settingError } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 4)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    if (!settingData) {
      return res.status(404).json({ message: "Resume setting not found" });
    }

    const limit = settingData.limit_resume;

    // Lấy tháng và năm của dateStart
    const month = new Date(dateStart).getMonth() + 1;
    const year = new Date(dateStart).getFullYear();

    // Xác định khoảng thời gian đầu và cuối của tháng
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Kiểm tra số lượng bản ghi trong bảng resume của tháng và năm đó
    const { count, error: resumeError } = await supabase
      .from("resume")
      .select("*", { count: "exact", head: true })
      .eq("id_setting_resume", 3)
      .gte("date_end", startOfMonth)
      .lte("date_start", endOfMonth)
      .eq("id_status", 2)
      .eq("id_staff", userId);

    if (resumeError) {
      return res.status(500).json({ error: resumeError.message });
    }

    if (count >= limit) {
      return res
        .status(400)
        .json({ message: "Limit reached for this month and year." });
    }

    // Cập nhật bản ghi trong bảng resume
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 4,
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 4)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Resume updated successfully.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume4 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 4)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    // Lấy giới hạn từ bảng setting_resume
    const { data: settingData, error: settingError } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 4)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    if (!settingData) {
      return res.status(404).json({ message: "Resume setting not found" });
    }

    const limit = settingData.limit_resume;

    // Lấy tháng và năm của dateStart
    const month = new Date(dateStart).getMonth() + 1;
    const year = new Date(dateStart).getFullYear();

    // Xác định khoảng thời gian đầu và cuối của tháng
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Kiểm tra số lượng bản ghi trong bảng resume của tháng và năm đó
    const { count, error: resumeError } = await supabase
      .from("resume")
      .select("*", { count: "exact", head: true })
      .eq("id_setting_resume", 4)
      .gte("date_end", startOfMonth)
      .lte("date_start", endOfMonth)
      .in("id_status", [1, 2])
      .eq("id_staff", userId);

    if (resumeError) {
      return res.status(500).json({ error: resumeError.message });
    }

    if (count >= limit) {
      return res
        .status(400)
        .json({ message: "Limit reached for this month and year." });
    }

    // Thực hiện thêm dữ liệu vào bảng resume
    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 4,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 4)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Resume inserted successfully.", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listresumeotherforuser = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select("*")
      .not(
        "id_setting_resume",
        "in",
        "(1, 2, 3, 4, 12, 13, 14, 15, 16 ,17, 18,19,20)"
      );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listresumeforuser = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select("*")
      .in("id_setting_resume", [1, 2, 3, 7, 12, 13, 14, 16, 17, 18, 19, 20]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listresumesettingforadmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listroleforadmin = async (req, res) => {
  try {
    const { data: results, error } = await supabase.from("role").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ role: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteroleforadmin = async (req, res) => {
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ message: "Không tìm thấy vai trờ" });
  }

  try {
    const { data, error } = await supabase
      .from("role")
      .delete()
      .eq("role_id", roleId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res
      .status(200)
      .json({ message: "Xóa vai trò thành công", deletedRole: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addRoleForAdmin = async (req, res) => {
  const {
    name_role,
    attendance_select,
    staff_select,
    staff_update,
    resume_select,
    resume_update,
    log_select,
    setting_select,
    setting_update,
    cms_dashboard,
    role_select,
    role_update,
    notification_select,
  } = req.body;

  // Kiểm tra nếu thiếu tên role (bắt buộc)
  if (!name_role) {
    return res.status(400).json({ message: "Tên vai trò chưa có" });
  }

  try {
    // Thêm role mới vào bảng 'role'
    const { data, error } = await supabase
      .from("role")
      .insert([
        {
          name_role,
          attendance_select: attendance_select ?? false,
          staff_select: staff_select ?? false,
          staff_update: staff_update ?? false,
          resume_select: resume_select ?? false,
          resume_update: resume_update ?? false,
          log_select: log_select ?? false,
          setting_select: setting_select ?? false,
          setting_update: setting_update ?? false,
          cms_dashboard: cms_dashboard ?? false,
          role_select: role_select ?? false,
          role_update: role_update ?? false,
          notification_select: notification_select ?? false,
        },
      ])
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Tạo vai trò thành công", role: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoleForAdmin = async (req, res) => {
  const {
    role_id,
    name_role,
    attendance_select,
    staff_select,
    staff_update,
    resume_select,
    resume_update,
    log_select,
    setting_select,
    setting_update,
    cms_dashboard,
    role_select,
    role_update,
    notification_select,
  } = req.body;

  // Kiểm tra nếu thiếu role_id (bắt buộc)
  if (!role_id) {
    return res.status(400).json({ message: "Không tìm thấy mã vai trò" });
  }

  try {
    // Cập nhật role theo role_id
    const { data, error } = await supabase
      .from("role")
      .update({
        name_role,
        attendance_select,
        staff_select,
        staff_update,
        resume_select,
        resume_update,
        log_select,
        setting_select,
        setting_update,
        cms_dashboard,
        role_select,
        role_update,
        notification_select,
        updated_at: new Date(), // Cập nhật thời gian
      })
      .eq("role_id", role_id)
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Vai trò không tìm thấy" });
    }

    res
      .status(200)
      .json({ message: "Cập nhật vai trò thành công", updatedRole: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResumeOther = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, resumesettingId, dateStart, dateEnd, description } =
    req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    // Cập nhật bản ghi trong bảng resume
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: resumesettingId,
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", resumesettingId)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật đơn ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật đơn " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật đơn ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật đơn " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResumeOther = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  try {
    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: resumeId,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeIds = data[0].id_resume;

    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", resumeId)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo đơn ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo đơn " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo đơn ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo đơn " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeIds
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume12 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 12)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật bản ghi trong bảng resume
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 12,
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 12)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume12 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 12)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 12,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 12)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume13 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 13)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật bản ghi trong bảng resume
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 13,
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 13)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume13 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 13)
      .in("id_status", [1, 2])
      .gte("date_start", dateStart);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 13,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 13)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume14 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 14)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 14)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume14 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 14)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 14,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 14)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume15 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, starttime, endtime } =
    req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged = currentResume.date_start !== dateStart;
    const isDateEndChanged = currentResume.date_end !== dateEnd;

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 15)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    const { data, error } = await supabase
      .from("resume")
      .update({
        id_setting_resume: 15,
        description: description,
        id_status: 1,
        id_staff: userId,
        time_start: starttime,
        time_end: endtime,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("time_start,time_end,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc, giờ bắt đầu, giờ kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 15)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công.", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume15 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, starttime, endtime } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 15)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`)
      .or(`and(time_start.lte.${endtime},time_end.gte.${starttime})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày hoặc giờ đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 15,
          description: description,
          id_status: 1,
          id_staff: userId,
          time_start: starttime,
          time_end: endtime,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,time_start,time_end,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc, giờ kết thúc, giờ bắt đấu (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 15)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume16 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, starttime, endtime } =
    req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    // Kiểm tra số ngày nghỉ trong lần cập nhật
    const startDate = DateTime.fromISO(dateStart);
    const endDate = DateTime.fromISO(dateEnd);

    const daysBetween = Math.ceil(endDate.diff(startDate, "days").days) + 1; // Cộng 1 vì tính cả ngày đầu tiên
    if (daysBetween > 7) {
      return res
        .status(400)
        .json({ error: "Không thể nghỉ quá 7 ngày trong một lần." });
    }

    // Lấy giới hạn từ bảng setting_resume
    const { data: settingData, error: settingError } = await supabase
      .from("setting_resume")
      .select("limit_resume")
      .eq("id_setting_resume", 16)
      .single();

    if (settingError) {
      return res.status(500).json({ error: settingError.message });
    }

    const limitResume = settingData.limit_resume;

    // Lấy các đơn nghỉ trong tháng
    const startOfMonth = startDate.startOf("month").toISODate();
    const endOfMonth = startDate.endOf("month").toISODate();

    const { data: resumesInMonth, error: resumesError } = await supabase
      .from("resume")
      .select("date_start, date_end")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 16)
      .in("id_status", [1, 2])
      .neq("id_resume", resumeId)
      .gte("date_start", dateStart)
      .lte("date_end", dateEnd);

    if (resumesError) {
      return res.status(500).json({ error: resumesError.message });
    }

    // Tính tổng số ngày đã nghỉ trong tháng
    let totalDaysInMonth = 0;
    resumesInMonth.forEach(({ date_start, date_end }) => {
      const start = DateTime.fromISO(date_start);
      const end = DateTime.fromISO(date_end);

      const validStart = DateTime.max(start, DateTime.fromISO(startOfMonth));
      const validEnd = DateTime.min(end, DateTime.fromISO(endOfMonth));

      totalDaysInMonth += Math.ceil(validEnd.diff(validStart, "days").days) + 1;
    });

    // Kiểm tra giới hạn số ngày nghỉ trong tháng
    if (totalDaysInMonth + daysBetween > limitResume) {
      return res.status(400).json({
        error: `Không thể tạo đơn, số ngày nghỉ vượt giới hạn ${limitResume} ngày trong tháng.`,
      });
    }

    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        time_start: starttime,
        time_end: endtime,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end,time_start,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc, giờ bắt đầu, giờ kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 16)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume16 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, starttime, endtime } = req.body;

  try {
    // Kiểm tra số ngày nghỉ
    const startDate = new Date(dateStart);
    const endDate = new Date(dateEnd);
    const dayDifference =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    if (dayDifference > 7) {
      return res.status(400).json({
        message: "Số ngày nghỉ không được vượt quá 7 ngày.",
      });
    }

    // Kiểm tra giới hạn từ bảng setting_resume
    const { data: limitData, error: limitError } = await supabase
      .from("setting_resume")
      .select("limit_resume")
      .eq("id_setting_resume", 16)
      .single();

    if (limitError) {
      return res.status(500).json({ error: limitError.message });
    }

    const limit = limitData.limit_resume;

    const currentDate = DateTime.now();
    const startOfMonth = currentDate.startOf("month").toISODate();
    const endOfMonth = currentDate.endOf("month").toISODate();

    const { data: resumeCountData, error: resumeCountError } = await supabase
      .from("resume")
      .select("date_start, date_end")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 16)
      .eq("id_status", 1)
      .or(`and(date_start.lte.${endOfMonth},date_end.gte.${startOfMonth})`);

    if (resumeCountError) {
      return res.status(500).json({ error: resumeCountError.message });
    }

    // Tính tổng số ngày đã nghỉ
    let totalDays = 0;

    resumeCountData.forEach((record) => {
      const startDate = DateTime.fromISO(record.date_start);
      const endDate = DateTime.fromISO(record.date_end);

      const adjustedStart =
        startDate < DateTime.fromISO(startOfMonth)
          ? DateTime.fromISO(startOfMonth)
          : startDate;
      const adjustedEnd =
        endDate > DateTime.fromISO(endOfMonth)
          ? DateTime.fromISO(endOfMonth)
          : endDate;

      const days = Math.ceil(adjustedEnd.diff(adjustedStart, "days").days) + 1;
      totalDays += days;
    });

    if (totalDays >= limit) {
      return res.status(400).json({
        message: "Đã đạt giới hạn số lượng đơn trong tháng.",
      });
    }

    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 16)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có.",
      });
    }

    // Thêm đơn mới
    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 16,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          time_start: starttime,
          time_end: endtime,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end,time_end,time_start");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc, giờ kết thúc, giờ bắt đấu (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 16)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume17 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, starttime } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 17)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        time_start: starttime,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end,time_start");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // ngày bắt đầu, kết thúc, giờ bắt đầu, giờ kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 17)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume17 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, starttime } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 17)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 17,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          time_start: starttime,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end,time_start");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc, giờ kết thúc, giờ bắt đấu (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 17)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume18 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, starttime, endtime } =
    req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 18)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        time_start: starttime,
        time_end: endtime,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end,time_start,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc, giờ bắt đầu, giờ kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 18)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume18 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, starttime, endtime } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 18)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 18,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          time_start: starttime,
          time_end: endtime,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end,time_start,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc, giờ kết thúc, giờ bắt đấu (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 18)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu : " +
        data[0].time_start +
        "\nGiờ kết thúc : " +
        data[0].time_end,
      resumeId
    );

    const resumeId = data[0].id_resume;
    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume19 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description, endtime } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    if (isDateStartChanged || isDateEndChanged) {
      // Kiểm tra trùng lặp
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 19)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }

    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        time_end: endtime,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc, giờ bắt đầu, giờ kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 19)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu vào làm : " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu vào làm : " +
        data[0].time_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume19 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description, endtime } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 19)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 19,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          time_end: endtime,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end,time_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc, giờ kết thúc, giờ bắt đấu (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 19)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu vào làm: " +
        data[0].time_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end +
        "\nGiờ bắt đầu vào làm: " +
        data[0].time_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateResume20 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { resumeId, dateStart, dateEnd, description } = req.body;

  if (!resumeId) {
    return res
      .status(400)
      .json({ error: "resumeId is required for updating a resume." });
  }

  try {
    const { data: existingDatas, error: fetchError } = await supabase
      .from("resume")
      .select("id_resume, date_start, date_end")
      .eq("id_resume", resumeId);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingDatas || existingDatas.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy dữ liệu hiện tại của đơn.",
      });
    }

    const currentResume = existingDatas[0];

    // Kiểm tra xem ngày có thay đổi hay không
    const isDateStartChanged =
      new Date(currentResume.date_start).toISOString() !==
      new Date(dateStart).toISOString();
    const isDateEndChanged =
      new Date(currentResume.date_end).toISOString() !==
      new Date(dateEnd).toISOString();

    // Nếu một trong hai ngày thay đổi, kiểm tra xung đột
    if (isDateStartChanged || isDateEndChanged) {
      const { data: existingData, error: existingError } = await supabase
        .from("resume")
        .select("*")
        .eq("id_staff", userId)
        .eq("id_setting_resume", 20)
        .in("id_status", [1, 2])
        .neq("id_resume", resumeId)
        .or(`date_start.lte.${dateEnd},date_end.gte.${dateStart}`); // Kiểm tra trùng lặp khoảng ngày

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      // Kiểm tra từng bản ghi trả về từ DB để loại bỏ trùng lặp
      const isOverlap = existingData.some((record) => {
        const { date_start, date_end } = record;
        return (
          (dateStart >= date_start && dateStart <= date_end) ||
          (dateEnd >= date_start && dateEnd <= date_end) ||
          (dateStart <= date_start && dateEnd >= date_end)
        );
      });

      if (isOverlap) {
        return res.status(400).json({
          message:
            "Ngày bắt đầu hoặc kết thúc trùng lặp với khoảng ngày đã tồn tại.",
        });
      }
    }
    // Cập nhật dữ liệu
    const { data, error } = await supabase
      .from("resume")
      .update({
        description: description,
        id_status: 1,
        id_staff: userId,
        date_start: dateStart,
        date_end: dateEnd,
        id_manager: id_manager,
      })
      .eq("id_resume", resumeId)
      .select("date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // ngày bắt đầu, kết thúc (  cập nhật )
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 20)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Cập nhật ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa cập nhật " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res.status(200).json({ message: "Cập nhật đơn thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertResume20 = async (req, res) => {
  const userId = req.user.userId;
  const id_manager = req.user.manager;
  const { dateStart, dateEnd, description } = req.body;

  try {
    // Kiểm tra trùng lặp hoặc nằm trong khoảng ngày
    const { data: existingData, error: existingError } = await supabase
      .from("resume")
      .select("*")
      .eq("id_staff", userId)
      .eq("id_setting_resume", 20)
      .in("id_status", [1, 2])
      .or(`and(date_start.lte.${dateEnd},date_end.gte.${dateStart})`);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingData && existingData.length > 0) {
      return res.status(400).json({
        message: "Ngày đang nằm trong khoảng đã có",
      });
    }

    const { data, error } = await supabase
      .from("resume")
      .insert([
        {
          id_setting_resume: 20,
          description: description,
          id_status: 1,
          id_staff: userId,
          date_start: dateStart,
          date_end: dateEnd,
          id_manager: id_manager,
        },
      ])
      .select("id_resume,date_start,date_end");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const resumeId = data[0].id_resume;
    // ngày bắt đầu, kết thúc (  tạo)
    const { data: settingDatas, error: settingErrorss } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId)
      .single();

    if (settingErrorss) {
      return res.status(500).json({ error: settingErrorss.message });
    }

    if (!settingDatas) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const { data: Datamanager, error: settingErrors } = await supabase
      .from("staff")
      .select("*")
      .eq("name", settingDatas.manager)
      .single();

    if (settingErrors) {
      return res.status(500).json({ error: settingErrors.message });
    }

    if (!Datamanager) {
      return res.status(404).json({ message: "Không tìm thấy quản lí" });
    }

    const { data: resumesetting, error: settingErrorxs } = await supabase
      .from("setting_resume")
      .select("*")
      .eq("id_setting_resume", 20)
      .single();

    if (settingErrorxs) {
      return res.status(500).json({ error: settingErrorxs.message });
    }

    if (!resumesetting) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    sendnotify(
      Datamanager.token_notification,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end
    );
    savenotification(
      Datamanager.id_staff,
      `Tạo ` + resumesetting.name_setting_resume,
      "Nhân viên : " +
        settingDatas.name +
        " vừa tạo " +
        resumesetting.name_setting_resume +
        "\nNgày bắt đầu : " +
        data[0].date_start +
        "\nNgày kết thúc : " +
        data[0].date_end,
      resumeId
    );

    res
      .status(201)
      .json({ message: "Thêm đơn thành công", resumeId: resumeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resumelistforuser = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { data: results, error } = await supabase
      .from("resume")
      .select(
        `
        *,
        staff: id_staff (*),
        status_resume: id_status (*),
        setting_resume: id_setting_resume (*)
      `
      )
      .eq("id_staff", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({ resume: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveResume = async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body]; // Chuyển dữ liệu thành mảng nếu là đối tượng đơn

  if (items.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để xử lý." });
  }

  const results = []; // Mảng lưu kết quả từng đơn

  try {
    for (let item of items) {
      const { resumeId, id_setting_resume } = item;
      console.log(resumeId);

      if (!resumeId) {
        results.push({ error: "Thiếu resumeId trong một mục.", resumeId });
        continue; // Tiếp tục với đơn tiếp theo nếu thiếu resumeId
      }
      if (id_setting_resume == 1) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, id_setting_resume } =
          resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Lấy thông tin checkin_time và checkout_time
        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings[0];

        // Lấy thông tin nhân viên (current_resume và limit_resume_year)
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("current_resume, limit_resume_year,id_time")
          .eq("id_staff", id_staff);
        if (staffError) {
          return res.status(500).json({ error: staffError.message });
        }

        const { current_resume, limit_resume_year, id_time } = staffData[0];

        // Tính số ngày nghỉ phép và kiểm tra giới hạn
        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        const attendanceData = [];
        let count = 0;

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          // Kiểm tra nếu là Chủ nhật thì bỏ qua
          if (currentDate.weekday === 7) {
            continue; // Không thực hiện các hành động bên dưới
          }

          const isSaturday = currentDate.weekday === 6; // Kiểm tra thứ Bảy (weekday = 6)
          count++;

          // Tính điểm (0.5 nếu là thứ Bảy)
          const score =
            current_resume + count <= limit_resume_year
              ? isSaturday
                ? 1
                : await calculateScore(
                    id_setting_resume,
                    checkin_time,
                    checkout_time,
                    currentDate,
                    id_time
                  )
              : 0;

          attendanceData.push({
            date: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            checkin_time: checkin_time,
            checkout_time: checkout_time,
            description: "Nghỉ phép",
            id_staff,
            id_status: 2,
            long_lat_checkin: null,
            long_lat_checkout: null,
            point_attandance: score,
          });

          // Ghi điểm vào Google Sheet
          await writeScoreToSheet(
            id_staff,
            score,
            currentDate.day,
            currentDate.month
          );
        }

        // Chèn dữ liệu vào bảng attendance
        const { error: insertError } = await supabase
          .from("attend")
          .insert(attendanceData);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }

        // Cập nhật current_resume trong bảng staff
        const newResumeCount = current_resume + count;

        const { error: updateErrorstaff } = await supabase
          .from("staff")
          .update({ current_resume: newResumeCount })
          .eq("id_staff", id_staff);

        if (updateErrorstaff) {
          return res.status(500).json({ error: updateErrorstaff.message });
        }

        // Ghi giá trị current_resume mới vào Google Sheet
        await writecurrentresume(id_staff, newResumeCount);

        // ngày bắt đầu, kết thúc (  tạo)
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 2) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select(
            "id_staff, date_start, date_end, time_start, time_end, id_setting_resume"
          );

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, time_start, time_end } =
          resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          const date = currentDate.day;
          const month = currentDate.month;
          const year = currentDate.year;
          // Lấy thông tin nhân viên (current_resume và limit_resume_year)
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];

          const score = await calculateScore(
            id_setting_resume,
            time_start,
            time_end,
            currentDate,
            id_time
          );

          // Kiểm tra nếu bản ghi đã tồn tại cho ngày này
          const { data: existingAttend, error: checkError } = await supabase
            .from("attend")
            .select("*")
            .eq("id_staff", id_staff)
            .eq("date", date)
            .eq("month", month)
            .eq("year", year);
          if (checkError) {
            return res.status(500).json({ error: checkError.message });
          }

          if (existingAttend) {
            let currentscore = existingAttend[0].point_attandance;
            if (currentscore === null) {
              currentscore = 0;
            }
            let scorenow = Number(currentscore) + Number(score);

            if (scorenow >= 1) {
              scorenow = 1;
            }

            const { error: updateError } = await supabase
              .from("attend")
              .update({
                point_attandance: scorenow,
                description: "Chấm công ( có đơn công tác )",
              })
              .eq("id_attend", existingAttend.id_attend);

            await writeScoreToSheet(id_staff, scorenow, date, month);

            if (updateError) {
              return res.status(500).json({ error: updateError.message });
            }
          }
        }
        // ngày bắt đầu, kết thúc (  tạo)
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 3) {
        console.log(resumeId);

        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, id_setting_resume } =
          resumeData[0];

        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }
        console.log(settings[0]);
        const { checkin_time } = settings[0];
        console.log(checkin_time);

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          const date = currentDate.day;
          const month = currentDate.month;
          const year = currentDate.year;

          // Kiểm tra nếu bản ghi đã tồn tại cho ngày này
          const { data: existingAttend, error: checkError } = await supabase
            .from("attend")
            .select("*")
            .eq("id_staff", id_staff)
            .eq("date", date)
            .eq("month", month)
            .eq("year", year);
          if (checkError) {
            return res.status(500).json({ error: checkError.message });
          }

          if (existingAttend) {
            const { data: staffData, error: staffError } = await supabase
              .from("staff")
              .select("current_resume, limit_resume_year,id_time")
              .eq("id_staff", id_staff);
            if (staffError) {
              return res.status(500).json({ error: staffError.message });
            }

            const { current_resume, limit_resume_year, id_time } = staffData[0];

            const score = await calculateScore(
              id_setting_resume1,
              checkin_time,
              existingAttend[0].checkout_time || 0,
              currentDate,
              id_time
            );

            const { error: updateError } = await supabase
              .from("attend")
              .update({
                point_attandance: score,
                description: "Chấm công ( đơn check in )",
                checkin_time: checkin_time,
              })
              .eq("id_attend", existingAttend[0].id_attend);

            await writeScoreToSheet(id_staff, score, date, month);

            if (updateError) {
              return res.status(500).json({ error: updateError.message });
            }
          }
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 4) {
        console.log(resumeId);

        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, id_setting_resume } =
          resumeData[0];

        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings[0];
        console.log(checkin_time);
        console.log(settings[0]);

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          const date = currentDate.day;
          const month = currentDate.month;
          const year = currentDate.year;

          // Kiểm tra nếu bản ghi đã tồn tại cho ngày này
          const { data: existingAttend, error: checkError } = await supabase
            .from("attend")
            .select("*")
            .eq("id_staff", id_staff)
            .eq("date", date)
            .eq("month", month)
            .eq("year", year);
          if (checkError) {
            return res.status(500).json({ error: checkError.message });
          }

          if (existingAttend) {
            const { data: staffData, error: staffError } = await supabase
              .from("staff")
              .select("current_resume, limit_resume_year,id_time")
              .eq("id_staff", id_staff);
            if (staffError) {
              return res.status(500).json({ error: staffError.message });
            }

            const { current_resume, limit_resume_year, id_time } = staffData[0];
            const score = await calculateScore(
              id_setting_resume1,
              existingAttend[0].checkin_time,
              checkout_time || 0,
              currentDate,
              id_time
            );

            const { error: updateError } = await supabase
              .from("attend")
              .update({
                point_attandance: score,
                description: "Chấm công ( Đơn check out )",
                checkout_time: checkout_time,
              })
              .eq("id_attend", existingAttend[0].id_attend);

            await writeScoreToSheet(id_staff, score, date, month);

            if (updateError) {
              return res.status(500).json({ error: updateError.message });
            }
          }
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 12) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, id_setting_resume } =
          resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings[0];

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        // const id_setting_resume1 = await findResumeIdForStaff(id_staff, currentDate1);

        const attendanceData = [];
        for (let i = 0; i <= daysBetween; i++) {
          // const score = await calculateScore(
          //   id_setting_resume1,
          //   checkin_time,
          //   checkout_time,
          //   currentDate1
          // );
          const currentDate = startDate.plus({ days: i });
          attendanceData.push({
            date: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            checkin_time: checkin_time,
            checkout_time: checkout_time,
            description: "Nghỉ phép dài hạn",
            id_staff,
            id_status: 2,
            long_lat_checkin: null,
            long_lat_checkout: null,
            point_attandance: 0,
          });
          await writeScoreToSheet(
            id_staff,
            0,
            currentDate.day,
            currentDate.month
          );
        }

        const { error: insertError } = await supabase
          .from("attend")
          .insert(attendanceData);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 13) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff,date_start");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start } = resumeData[0];

        const { data, error } = await supabase
          .from("staff")
          .update({ status: false })
          .eq("id_staff", id_staff);

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );

        res.status(200).json({ message: "Hủy tài khoản thành công" });
      } else if (id_setting_resume == 14) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, id_setting_resume } =
          resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Lấy thông tin checkin_time và checkout_time
        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings[0];

        // Tính số ngày nghỉ phép và kiểm tra giới hạn
        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);
        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );
        const attendanceData = [];
        let count = 0;

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          // Kiểm tra nếu là Chủ nhật thì bỏ qua
          if (currentDate.weekday === 7) {
            continue; // Không thực hiện các hành động bên dưới
          }

          const isSaturday = currentDate.weekday === 6; // Kiểm tra thứ Bảy (weekday = 6)
          count++;

          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];

          // Tính điểm (0.5 nếu là thứ Bảy)
          const score =
            0 + count <= 3
              ? isSaturday
                ? 1
                : await calculateScore(
                    id_setting_resume1,
                    checkin_time,
                    checkout_time,
                    currentDate,
                    id_time
                  )
              : 0;

          attendanceData.push({
            date: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            checkin_time: checkin_time,
            checkout_time: checkout_time,
            description: "Nghỉ hiếu hỉ",
            id_staff,
            id_status: 2,
            long_lat_checkin: null,
            long_lat_checkout: null,
            point_attandance: score,
          });

          // Ghi điểm vào Google Sheet
          await writeScoreToSheet(
            id_staff,
            score,
            currentDate.day,
            currentDate.month
          );
        }

        // Chèn dữ liệu vào bảng attendance
        const { error: insertError } = await supabase
          .from("attend")
          .insert(attendanceData);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }

        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 15) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select(
            "id_staff, date_start, date_end, time_start, time_end, id_setting_resume"
          );

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const {
          id_staff,
          date_start,
          date_end,
          time_start,
          time_end,
          id_setting_resume,
        } = resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Lấy thông tin nhân viên (current_resume và limit_resume_year)
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("current_resume")
          .eq("id_staff", id_staff);
        if (staffError) {
          return res.status(500).json({ error: staffError.message });
        }
        const { current_resume } = staffData[0];

        console.log(current_resume);

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);
        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          const date = currentDate.day;
          const month = currentDate.month;
          const year = currentDate.year;
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];
          const score = await calculateScore(
            id_setting_resume1,
            time_start,
            time_end,
            currentDate,
            id_time
          );

          // Kiểm tra nếu bản ghi đã tồn tại cho ngày này
          const { data: existingAttend, error: checkError } = await supabase
            .from("attend")
            .select("*")
            .eq("id_staff", id_staff)
            .eq("date", date)
            .eq("month", month)
            .eq("year", year);
          if (checkError) {
            return res.status(500).json({ error: checkError.message });
          }

          if (existingAttend) {
            let currentscore = existingAttend[0].point_attandance;
            if (currentscore === null) {
              currentscore = 0;
            }
            let scorenow = Number(currentscore) + Number(score);
            console.log(scorenow);

            if (scorenow >= 1) {
              scorenow = 1;
            }

            const { error: updateError } = await supabase
              .from("attend")
              .update({
                point_attandance: scorenow,
                description: "Đơn vắng mặt theo giờ",
              })
              .eq("id_attend", existingAttend[0].id_attend);

            await writeScoreToSheet(id_staff, scorenow, date, month);

            if (updateError) {
              return res.status(500).json({ error: updateError.message });
            }

            // Cập nhật current_resume trong bảng staff
            const newResumeCount = Number(current_resume) + Number(score);
            console.log(newResumeCount);

            const { error: updateErrorstaff } = await supabase
              .from("staff")
              .update({ current_resume: newResumeCount })
              .eq("id_staff", id_staff);

            if (updateErrorstaff) {
              return res.status(500).json({ error: updateErrorstaff.message });
            }

            // Ghi giá trị current_resume mới vào Google Sheet
            await writecurrentresume(id_staff, newResumeCount);
          }
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 16) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end } = resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Lấy thông tin checkin_time và checkout_time
        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings;

        // Tính số ngày nghỉ phép và kiểm tra giới hạn
        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);

        const attendanceData = [];
        let count = 0;

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          // Kiểm tra nếu là Chủ nhật thì bỏ qua
          if (currentDate.weekday === 7) {
            continue; // Không thực hiện các hành động bên dưới
          }

          const isSaturday = currentDate.weekday === 6; // Kiểm tra thứ Bảy (weekday = 6)
          count++;

          // Tính điểm (0.5 nếu là thứ Bảy)
          const score = 0 + count <= 12 ? (isSaturday ? 0 : 0) : 0;

          attendanceData.push({
            date: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            checkin_time: checkin_time,
            checkout_time: checkout_time,
            description: "Nghỉ phép không dùng phép năm",
            id_staff,
            id_status: 3,
            long_lat_checkin: null,
            long_lat_checkout: null,
            point_attandance: score,
          });

          // Ghi điểm vào Google Sheet
          await writeScoreToSheet(
            id_staff,
            score,
            currentDate.day,
            currentDate.month
          );
        }

        // Chèn dữ liệu vào bảng attendance
        const { error: insertError } = await supabase
          .from("attend")
          .insert(attendanceData);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 17) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, time_start");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, time_start } = resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Tính số ngày nghỉ phép
        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);
        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );
        const errors = [];

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          // Kiểm tra ngày công trong database
          const { data: existingRecord, error: selectError } = await supabase
            .from("attend")
            .select("id_attend, checkin_time")
            .eq("date", currentDate.day)
            .eq("month", currentDate.month)
            .eq("year", currentDate.year)
            .eq("id_staff", id_staff);
          if (selectError || !existingRecord) {
            errors.push(
              `Ngày công ${currentDate.day}/${currentDate.month}/${currentDate.year} không tồn tại hoặc không thể kiểm tra.`
            );
            continue; // Bỏ qua ngày này
          }
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];
          const calculatedScore = await calculateScore(
            id_setting_resume1,
            existingRecord[0].checkin_time,
            time_start,
            currentDate,
            id_time
          );

          if (!calculatedScore && calculatedScore !== 0) {
            errors.push(
              `Lỗi khi tính điểm cho ngày ${currentDate.day}/${currentDate.month}/${currentDate.year}.`
            );
            continue;
          }

          // Cập nhật checkout_time và ghi điểm mới
          const { error: updateErrors } = await supabase
            .from("attend")
            .update({
              checkout_time: time_start,
              point_attandance: calculatedScore,
            })
            .eq("id_attend", existingRecord[0].id_attend);

          if (updateErrors) {
            errors.push(
              `Lỗi khi cập nhật điểm cho ngày ${currentDate.day}/${currentDate.month}/${currentDate.year}.`
            );
            continue;
          }

          // Ghi điểm vào Google Sheet
          try {
            await writeScoreToSheet(
              id_staff,
              calculatedScore,
              currentDate.day,
              currentDate.month
            );
          } catch (sheetError) {
            errors.push(
              `Lỗi ghi điểm Google Sheet cho ngày ${currentDate.day}/${currentDate.month}/${currentDate.year}.`
            );
          }
        }

        // Trả về lỗi nếu có
        if (errors.length > 0) {
          return res.status(400).json({ errors });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 18) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select(
            "id_staff, date_start, date_end, time_start, time_end, id_setting_resume"
          );

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end, time_start, time_end } =
          resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);
        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          const date = currentDate.day;
          const month = currentDate.month;
          const year = currentDate.year;

          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];
          const score = await calculateScore(
            id_setting_resume1,
            time_start,
            time_end,
            currentDate,
            id_time
          );
          // Kiểm tra nếu bản ghi đã tồn tại cho ngày này
          const { data: existingAttend, error: checkError } = await supabase
            .from("attend")
            .select("*")
            .eq("id_staff", id_staff)
            .eq("date", date)
            .eq("month", month)
            .eq("year", year);
          if (checkError) {
            return res.status(500).json({ error: checkError.message });
          }

          if (existingAttend) {
            let currentscore = existingAttend[0].point_attandance;

            if (currentscore === null) {
              currentscore = 0;
            }
            let scorenow = Number(currentscore) - Number(score);

            if (scorenow <= 0) {
              scorenow = 0;
            }

            const { error: updateError } = await supabase
              .from("attend")
              .update({
                point_attandance: scorenow,
                description: "Chấm công ( có đơn nghỉ theo giờ không lương )",
              })
              .eq("id_attend", existingAttend[0].id_attend);

            await writeScoreToSheet(id_staff, scorenow, date, month); // Ghi điểm vào sheet

            if (updateError) {
              return res.status(500).json({ error: updateError.message });
            }
          }
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 19) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", resumeData[0].id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else if (id_setting_resume == 20) {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        const { id_staff, date_start, date_end } = resumeData[0];

        if (!date_start || !date_end) {
          return res
            .status(400)
            .json({ error: "Start and end dates are required." });
        }

        // Lấy thông tin checkin_time và checkout_time
        const { data: settings, error: settingsError } = await supabase
          .from("setting_time")
          .select("checkin_time, checkout_time");
        if (settingsError) {
          return res.status(500).json({ error: settingsError.message });
        }

        const { checkin_time, checkout_time } = settings[0];

        // Tính số ngày nghỉ phép và kiểm tra giới hạn
        const startDate = DateTime.fromISO(date_start);
        const endDate = DateTime.fromISO(date_end);
        const daysBetween = Math.ceil(endDate.diff(startDate, "days").days);
        const currentDate1 = DateTime.now().toISODate(); // Định dạng ngày hiện tại cho so sánh
        const id_setting_resume1 = await findResumeIdForStaff(
          id_staff,
          currentDate1
        );
        const attendanceData = [];
        let count = 0;

        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = startDate.plus({ days: i });

          // Kiểm tra nếu là Chủ nhật thì bỏ qua
          if (currentDate.weekday === 7) {
            continue; // Không thực hiện các hành động bên dưới
          }

          const isSaturday = currentDate.weekday === 6; // Kiểm tra thứ Bảy (weekday = 6)
          count++;
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("current_resume, limit_resume_year,id_time")
            .eq("id_staff", id_staff);
          if (staffError) {
            return res.status(500).json({ error: staffError.message });
          }

          const { current_resume, limit_resume_year, id_time } = staffData[0];
          // Tính điểm (0.5 nếu là thứ Bảy)
          const score =
            0 + count <= 30000
              ? isSaturday
                ? 1
                : await calculateScore(
                    id_setting_resume1,
                    checkin_time,
                    checkout_time,
                    currentDate,
                    id_time
                  )
              : 0;

          attendanceData.push({
            date: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
            checkin_time: checkin_time,
            checkout_time: checkout_time,
            description: "Đơn công tác nhiều ngày",
            id_staff,
            id_status: 2,
            long_lat_checkin: null,
            long_lat_checkout: null,
            point_attandance: score,
          });
          // Ghi điểm vào Google Sheet
          await writeScoreToSheet(
            id_staff,
            score,
            currentDate.day,
            currentDate.month
          );
        }

        // Chèn dữ liệu vào bảng attendance
        const { error: insertError } = await supabase
          .from("attend")
          .insert(attendanceData);

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", id_staff);
        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      } else {
        const { data: resumeData, error: updateError } = await supabase
          .from("resume")
          .update({ id_status: 2 })
          .eq("id_resume", resumeId)
          .select("id_staff, date_start, date_end, id_setting_resume");

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        const { data: settingDatas, error: settingErrorss } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", resumeData[0].id_staff);

        if (settingErrorss) {
          return res.status(500).json({ error: settingErrorss.message });
        }

        if (!settingDatas) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên" });
        }

        const { data: resumesetting, error: settingErrorxs } = await supabase
          .from("setting_resume")
          .select("*")
          .eq("id_setting_resume", id_setting_resume);
        if (settingErrorxs) {
          return res.status(500).json({ error: settingErrorxs.message });
        }

        if (!resumesetting) {
          return res.status(404).json({ message: "Không tìm thấy đơn" });
        }
        sendnotify(
          settingDatas[0].token_notification,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume
        );
        savenotification(
          settingDatas[0].id_staff,
          `Duyệt ` + resumesetting[0].name_setting_resume,
          "Quản viên : " +
            settingDatas[0].manager +
            " vừa duyệt " +
            resumesetting[0].name_setting_resume,
          resumeId
        );
      }
    }
    res.status(200).json({
      message: "Duyệt đơn thành công",
    });
  } catch (err) {
    console.log(err.message);
  }
};

// get info setting resume
exports.getsettinglimitresume = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("setting_resume")
      .select(`*`);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    res.status(200).json({
      setting_resume_total: results,
      setting_resume_name: results.name_setting_resume,
      setting_resume_limit_resume: results.limit_resume,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get resume for Admin
exports.getAllInfoUserForAdmin = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data: results, error: firstError } = await supabase
      .from("staff")
      .select("*")
      .eq("id_staff", userId);

    if (firstError) {
      return res.status(500).json({ error: firstError.message });
    }

    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin nhân viên." });
    }

    const name = results[0].name;

    const { data: result, error: secondError } = await supabase
      .from("staff")
      .select("*")
      .eq("status", true)
      .eq("manager", name);

    if (secondError) {
      return res.status(500).json({ error: secondError.message });
    }

    res.status(200).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testnetwork = async (req, res) => {
  try {
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// phần thông báo

exports.tokennotification = async (req, res) => {
  const userId = req.user.userId;
  const { tokennotification } = req.body;

  try {
    const { data: existingData, error: fetchError } = await supabase
      .from("staff")
      .select("token_notification")
      .eq("id_staff", userId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (existingData && existingData.token_notification) {
      return res.status(400).json({ message: false });
    }

    const { data, error } = await supabase
      .from("staff")
      .update({ token_notification: tokennotification })
      .eq("id_staff", userId);

    if (error) {
      throw new Error(error.message);
    }
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Lỗi khi xử lý token_notification:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

async function sendnotify(expoPushToken, title, body) {
  if (!expoPushToken) {
    return;
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { screen: "ListNotification" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

// Tạo một instance Supabase client với URL và Key trực tiếp
const supabaseOther = createClient(
  "https://eqgchrzbwxnzhzjtfwqg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2Nocnpid3huemh6anRmd3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzY1NjIsImV4cCI6MjA1MDI1MjU2Mn0.fobS5EH1SwkAx3Y8Wvj0L_hdiTHC7leJsBnaZ6f3AfU" // Thay bằng Supabase Key của bạn
);

async function savenotification(id_staff, title, body, resume_id) {
  try {
    // Cập nhật hoặc chèn token_notification mới
    const { data, error } = await supabaseOther.from("notification").insert({
      title: title,
      id_staff: id_staff,
      body: body,
      resume_id: resume_id,
      status: false,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    console.error("Error processing token_notification:", err.message);
  }
}

exports.getnotification = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data: existingData, error: fetchError } = await supabaseOther
      .from("notification")
      .select("*")
      .eq("id_staff", userId);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (existingData && existingData.title) {
      return res.status(400).json({ message: false });
    }

    res.status(200).json({ message: true, existingData });
  } catch (err) {
    console.error("Lỗi khi xử lý token_notification:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.checknotification = async (req, res) => {
  const { id } = req.body;

  try {
    const { data: existingData, error: fetchError } = await supabaseOther
      .from("notification")
      .select("*")
      .eq("id", id);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const { error: updateError } = await supabaseOther
      .from("notification")
      .update({ status: true })
      .eq("id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.status(200).json({ message: true, existingData });
  } catch (err) {
    console.error("Lỗi khi xử lý token_notification:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getallnotification = async (req, res) => {
  try {
    const { data: notifications, error: notificationError } =
      await supabaseOther.from("notification").select("*");

    if (notificationError) {
      throw new Error(notificationError.message);
    }

    if (!notifications || notifications.length === 0) {
      return res.status(200).json({ message: true, data: [] });
    }

    // Trích xuất danh sách mã nhân viên từ notifications
    const employeeIds = notifications.map((n) => n.id_staff);

    // Lấy thông tin nhân viên từ bảng employee trong Supabase khác
    const { data: employees, error: employeeError } = await supabase
      .from("staff")
      .select("id_staff, name") // Lấy thông tin cần thiết
      .in("id_staff", employeeIds); // Lọc theo mã nhân viên

    if (employeeError) {
      throw new Error(employeeError.message);
    }

    // Kết hợp thông tin từ hai bảng
    const result = notifications.map((notification) => {
      const employee = employees.find(
        (e) => e.id_staff === notification.id_staff
      );
      return {
        ...notification,
        employee_name: employee ? employee.name : null, // Ghép tên nhân viên nếu có
      };
    });

    // Trả về dữ liệu sau khi join
    res.status(200).json({ message: true, result });
  } catch (err) {
    console.error(
      "Lỗi khi xử lý getAllNotificationWithEmployeeName:",
      err.message
    );
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendnotificationfromcms = async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  if (items.length === 0) {
    return res.status(400).json({ error: "Không có dữ liệu để xử lý." });
  }

  try {
    const results = [];

    for (const item of items) {
      let { staff_id, title, body } = item;
      console.log("Yêu cầu nhận được từ client:", item);

      if (!Array.isArray(staff_id)) {
        staff_id = [staff_id]; // Nếu không phải mảng, chuyển thành mảng để xử lý
      }

      for (const singleStaffId of staff_id) {
        // Lấy thông tin nhân viên
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("*")
          .eq("id_staff", singleStaffId)
          .single();

        if (staffError || !staffData) {
          results.push({
            staff_id: singleStaffId,
            success: false,
            error: staffError ? staffError.message : "Không tìm thấy nhân viên",
          });
          continue;
        }

        try {
          // Gửi thông báo
          sendnotify(staffData.token_notification, `Thông báo: ${title}`, body);

          // Lưu thông báo
          savenotification(
            singleStaffId,
            `Thông báo: ${title}`,
            body,
            singleStaffId
          );

          results.push({
            staff_id: singleStaffId,
            success: true,
            message: "Gửi thông báo thành công.",
          });
        } catch (err) {
          results.push({
            staff_id: singleStaffId,
            success: false,
            error: `Lỗi khi gửi thông báo: ${err.message}`,
          });
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Xử lý thông báo thành công.", results });
  } catch (err) {
    console.error("Lỗi khi xử lý:", err);
    return res.status(500).json({ error: err.message });
  }
};

// end
