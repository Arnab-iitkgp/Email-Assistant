// scheduler.js
const cron = require('node-cron');
const fetchEmailsForAllUsers = require('./agents/collectorAgent');
const sendAlerts = require('./agents/alertAgent');
const generateDigest = require('./agents/digestAgent');

let jobs = []; // holds cron jobs

function startScheduler() {
  if (jobs.length) {
    console.log('Scheduler already running.');
    return;
  }

  console.log('🚀 Starting scheduler...');

  // Digest 3 times daily (9AM, 4PM, 9PM IST -> UTC expressions already used previously)
  jobs.push(
    cron.schedule('30 3,10,15 * * *', async () => {
      console.log('🧑‍💻 Daily Digest report...');
      try { await generateDigest(); } catch (err) { console.error('Error generating digest:', err); }
    })
  );

  // Check for new emails every 30 mins
  jobs.push(
    cron.schedule('*/30 * * * *', async () => {
      console.log('📧 Checking for new emails...');
      try { await fetchEmailsForAllUsers(); } catch (err) { console.error('Error fetching emails:', err); }
    })
  );

  // Alerts every 15 mins
  jobs.push(
    cron.schedule('*/15 * * * *', async () => {
      console.log('⏰ Checking for alerts...');
      try { await sendAlerts(); } catch (err) { console.error('Error sending alerts:', err); }
    })
  );

  // start all jobs (node-cron schedules aren't running until scheduled.start is called by default —
  // cron.schedule with function returns a job that is started by default, but being explicit is safe)
  jobs.forEach(j => j.start());
}

function stopScheduler() {
  if (!jobs.length) {
    console.log('Scheduler already stopped.');
    return;
  }
  console.log('🛑 Stopping scheduler...');
  jobs.forEach(j => j.stop());
  jobs = [];
}

function isSchedulerRunning() {
  return jobs.length > 0;
}

module.exports = { startScheduler, stopScheduler, isSchedulerRunning };
