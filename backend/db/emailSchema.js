const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sender: String,
    subject: String,
    body: String,
    threadId: String,
    timestamp: Date,
    category: { type: String, enum :['Urgent','Important','FYI','Spam'],default: 'FYI'},
    summary: { type: String, default: '' },
    deadlines: [{
        deadline:Date,
        alerted24h:{type:Boolean,default:false},
        alerted3h: { type: Boolean, default: false },  
        alerted1h:{type:Boolean,default:false}
    }
    ]
});

module.exports = mongoose.model('Email', emailSchema);
