const mongoose = require("mongoose");

const gradingConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  levels: [{ type: String, required: true }], // Array of grade levels like ["Poor", "Good", "Great"]
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GradingConfig", gradingConfigSchema);


