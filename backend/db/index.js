const mongoose = require("mongoose");
const Email = require("./emailSchema");
require("dotenv").config();
const schedulerState = require("./schedularState");
const { startScheduler } = require('../scheduler');
// Connect to MongoDB
const connectDB = async () => {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log("Mongo connected");

      try {
        const state = await SchedulerState.findOne({});
        if (state?.isScheduled) {
          console.log(
            "Persisted scheduler state is true -> starting scheduler"
          );
          // startScheduler();
        } else {
          console.log(
            "Persisted scheduler state is false -> scheduler will stay stopped until /start"
          );
        }
      } catch (err) {
        console.error("Error checking scheduler state:", err);
      }
    })
    .catch((err) => {
      console.error("Mongo connection error", err);
      process.exit(1);
    });
};

module.exports = connectDB;
