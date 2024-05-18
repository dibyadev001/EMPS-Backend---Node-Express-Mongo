// app.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./DB/db");
const routes = require("./Routes/routes");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

connectDB();
app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
