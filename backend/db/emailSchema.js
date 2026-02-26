const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sender: String,
    subject: String,
    body: String,
    threadId: String,
    timestamp: Date,
    category: { type: String, enum: ['Urgent', 'Important', 'FYI', 'Spam'], default: 'FYI' },
    summary: { type: String, default: '' },
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
emailSchema.index({ userId: 1, threadId: 1 });   // Used during the fetch loop to prevent duplicates
emailSchema.index({ "deadlines.deadline": 1 });  // Used by the deadline/alerts aggregate queries

module.exports = mongoose.model('Email', emailSchema);
