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
    required: false  // Can be null for global configs
  },
  isActive: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],  // Array of college IDs that can use this config
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GradingConfig", gradingConfigSchema);


