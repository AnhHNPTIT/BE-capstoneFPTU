const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDatabase = async () => {
  try {
    const uri = process.env.DB_URI;

    //connectDatabase
    await mongoose.connect(uri, {});

    //success
    console.log("Connected database");
  } catch (err) {
    console.log(err.message);
    console.log("Connect DB failed");
  }
};
module.exports = connectDatabase;
