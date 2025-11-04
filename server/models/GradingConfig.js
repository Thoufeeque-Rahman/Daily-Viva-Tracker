const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String },
  mark: { type: Number, required: true },
  color: { type: String, required: true },
  description: { type: String }
});

const gradingConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  levels: [levelSchema],
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GradingConfig", gradingConfigSchema);


