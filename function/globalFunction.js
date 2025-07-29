function generateUniqueRandomNumberString(length) {
  const numbers = new Set();

  while (numbers.size < length) {
    const randomNumber = Math.floor(Math.random() * 10); // Từ 0 đến 9
    numbers.add(randomNumber);
  }

  return Array.from(numbers).join(""); // Chuyển đổi Set thành chuỗi
}

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}
const getCurrentTimeCheckInCheckOut = () => {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0"); // Định dạng giờ
  const minutes = String(now.getMinutes()).padStart(2, "0"); // Định dạng phút
  const seconds = String(now.getSeconds()).padStart(2, "0"); // Định dạng giây

  return `${hours}:${minutes}:${seconds}`;
};

module.exports = {
  generateUniqueRandomNumberString,
  getCurrentTimeCheckInCheckOut,
  generateRandomString,
};
