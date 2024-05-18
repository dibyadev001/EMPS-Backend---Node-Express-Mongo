// helpers.js
const sharp = require("sharp");
const multer = require("multer");

const generateEmployeeID = () => {
  const min = 1000;
  const max = 9999;
  return "DB" + Math.floor(Math.random() * (max - min + 1) + min);
};

const isEmployeeIDUnique = async (employeeID) => {
  const existingUser = await User.findOne({ employeeID });
  return !existingUser;
};

const getCurrentDateAndTime = () => {
  const now = new Date();

  // Format date to DD-MM-YYYY
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = now.getFullYear();
  const date = `${day}-${month}-${year}`;

  // Format time to en-US 12-hour format with AM/PM
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const time = now.toLocaleTimeString("en-US", options);

  return { date, time };
};

const calculateElapsedTime = (checkInTime) => {
  const [checkInHours, checkInMinutes, checkInSeconds] = checkInTime
    .match(/\d{2}/g)
    .map(Number);
  const checkInDate = new Date();
  checkInDate.setHours(
    (checkInHours % 12) + (checkInTime.includes("PM") ? 12 : 0),
    checkInMinutes,
    checkInSeconds
  );

  const now = new Date();
  const elapsedTime = now - checkInDate;

  const h = String(Math.floor(elapsedTime / (1000 * 60 * 60))).padStart(2, "0");
  const m = String(
    Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60))
  ).padStart(2, "0");
  const s = String(Math.floor((elapsedTime % (1000 * 60)) / 1000)).padStart(
    2,
    "0"
  );

  return `${h}:${m}:${s}`;
};

const upload = () =>
  multer({
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Please upload an image file"));
      }
      cb(undefined, true);
    },
  }).single("avatar"); //for image upload

  const resizeAndConvert = async (buffer) => {
    try {
      let resizedImageBuffer = buffer;
      const imageInfo = await sharp(buffer).metadata();
      const targetSize = 200;

      resizedImageBuffer = await sharp(buffer)
        .resize({
          width: targetSize,
          height: targetSize,
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat("webp")
        .toBuffer();

      return resizedImageBuffer;
    } catch (error) {
      throw new Error("Error resizing and converting image");
    }
  };

module.exports={
  generateEmployeeID,
  isEmployeeIDUnique,
  getCurrentDateAndTime,
  calculateElapsedTime,
  upload,
  resizeAndConvert
};
