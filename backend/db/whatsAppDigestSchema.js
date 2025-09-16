const mongoose = require('mongoose');

const WhatsAppDigestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: Date,
    required: true,
    unique: true, // ensures one digest per day
  },
  digestText: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // optional: adds createdAt and updatedAt
});

const WhatsAppDigest = mongoose.model('WhatsAppDigest', WhatsAppDigestSchema);
WhatsAppDigestSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = WhatsAppDigest;
