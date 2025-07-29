const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: "Token has expired" });
    }

    req.user = decoded;
    next(); // Tiếp tục đến middleware/route tiếp theo
  } catch (error) {
    console.error('Token verification error:', error); // Log lỗi
    res.status(400).json({ message: "Invalid token" });
  }
};
