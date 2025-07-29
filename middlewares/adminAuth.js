const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Lấy token từ header

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Giải mã token

    if (Date.now() >= decoded.exp * 1000) { // Kiểm tra token có hết hạn không
      return res.status(401).json({ message: "Token has expired" });
    }


    if (decoded.cms_dashboard === false) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.user = decoded; // Lưu thông tin người dùng vào req.user
    next(); // Cho phép tiếp tục tới route tiếp theo nếu roleId là 1 (admin)
  } catch (error) {
    console.error('Token verification error:', error); // Log lỗi giải mã token
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = adminAuth;
