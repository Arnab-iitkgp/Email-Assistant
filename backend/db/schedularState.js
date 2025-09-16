// models/SchedulerState.js
const mongoose = require('mongoose');

const SchedulerStateSchema = new mongoose.Schema({
  isScheduled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SchedulerState', SchedulerStateSchema);
