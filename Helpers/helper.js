// helpers.js
const sharp = require("sharp");

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
  const elapsedTime = Math.abs(now - checkInDate);

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


const resizeAndConvert = async (buffer) => {
  try {
    let resizedImageBuffer = buffer;
    const imageInfo = await sharp(buffer).metadata();

    // Define the target width and height
    const targetSize = 200;

    // If the image is wider than tall
    if (imageInfo.width > imageInfo.height) {
      resizedImageBuffer = await sharp(buffer)
        .resize({
          width: targetSize,
          height: targetSize, // Maintain the square aspect ratio
          fit: "fill", // Stretch the image to fill the specified dimensions
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // Background color if the image aspect ratio doesn't match
        })
        .toFormat("webp") // Convert to WebP format
        .toBuffer();
    } else if (imageInfo.height > imageInfo.width) {
      // If the image is taller than wide
      resizedImageBuffer = await sharp(buffer)
        .resize({
          width: targetSize,
          height: targetSize, // Maintain the square aspect ratio
          fit: "fill", // Stretch the image to fill the specified dimensions
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // Background color if the image aspect ratio doesn't match
        })
        .toFormat("webp") // Convert to WebP format
        .toBuffer();
    } else {
      // If the image is already square
      resizedImageBuffer = await sharp(buffer)
        .resize({
          width: targetSize,
          height: targetSize, // Maintain the square aspect ratio
          fit: "contain", // Fit the image within the specified dimensions without cropping
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // Background color if the image aspect ratio doesn't match
        })
        .toFormat("webp") // Convert to WebP format
        .toBuffer();
    }

    return resizedImageBuffer;
  } catch (error) {
    throw new Error("Error resizing and converting image");
  }
};



module.exports={

  getCurrentDateAndTime,
  calculateElapsedTime,
  resizeAndConvert

};
