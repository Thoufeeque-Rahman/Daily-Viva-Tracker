const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound unique index to allow same subject names across different colleges
subjectSchema.index({ name: 1, collegeId: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);


