const nodemailer = require("nodemailer");
exports.transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  service: "gmail",
  secure: false,
  auth: {
    user: "ecoopmart.app@gmail.com",
    pass: "gfiexhusjpvwkhsi",
  },
  tls: {
    rejectUnauthorized: false,
  },
  socketTimeout: 5000, // thời gian chờ socket
  connectionTimeout: 5000, // thời gian chờ kết nối
});

const option = {
  from: "SystemNoReply",
  to: ``,
  subject: ``,
  text: ``,
};

exports.optionMail = (to, subject, text) => {
  option.to = to;
  option.subject = subject;
  option.text = text;
};