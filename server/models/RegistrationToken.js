const mongoose = require('mongoose');

const registrationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  maxUses: {
    type: Number,
    required: true,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add compound index for efficient queries
registrationTokenSchema.index({ token: 1, isActive: 1 });

module.exports = mongoose.model('RegistrationToken', registrationTokenSchema);