const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/mytest", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit with failure
  }
}

module.exports = connectDB;
