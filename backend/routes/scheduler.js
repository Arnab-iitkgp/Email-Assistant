// routes/scheduler.js
const express = require("express");
const router = express.Router();
const SchedulerState = require("../db/schedularState");
const {
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
} = require("../scheduler");

// Wake endpoint used by external pinger to keep the process warm
router.get("/wake", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Start
router.post("/start", async (req, res) => {
  try {
    await SchedulerState.updateOne(
      {},
      { isScheduled: true, updatedAt: new Date() },
      { upsert: true }
    );
    startScheduler();
    return res.json({ running: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed to start" });
  }
});

// Stop
router.post("/stop", async (req, res) => {
  try {
    await SchedulerState.updateOne(
      {},
      { isScheduled: false, updatedAt: new Date() },
      { upsert: true }
    );
    stopScheduler();
    return res.json({ running: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed to stop" });
  }
});

// Status (in-memory + persisted)
router.get("/status", async (req, res) => {
  try {
    const state = await SchedulerState.findOne({});
    res.json({
      running: isSchedulerRunning(),
      persisted: !!state?.isScheduled,
    });
  } catch (err) {
    res.status(500).json({ error: "failed to read status" });
  }
});

module.exports = router;
