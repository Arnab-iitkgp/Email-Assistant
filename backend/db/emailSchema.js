const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gmailMsgId: String,
    sender: String,
    subject: String,
    body: String,
    threadId: String,
    timestamp: Date,
    category: { type: String, enum: ['Urgent', 'Important', 'FYI', 'Spam'], default: 'FYI' },
    summary: { type: String, default: '' },
    calendarSynced: { type: Boolean, default: false },
    deadlines: [{
        deadline: Date,
        alerted24h: { type: Boolean, default: false },
        alerted3h: { type: Boolean, default: false },
        alerted1h: { type: Boolean, default: false }
    }
    ]
});

// Create indexes for faster queries
emailSchema.index({ userId: 1, timestamp: -1 }); // Used by the GET /today endpoint
emailSchema.index({ userId: 1, threadId: 1 }, { unique: true });   // Unique constraint prevents duplicate emails per user+thread
emailSchema.index({ userId: 1, gmailMsgId: 1 });  // Fast lookup by Gmail message ID
emailSchema.index({ "deadlines.deadline": 1 });  // Used by the deadline/alerts aggregate queries

module.exports = mongoose.model('Email', emailSchema);
