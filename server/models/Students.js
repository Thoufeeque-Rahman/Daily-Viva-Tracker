const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  name: String,
  fullName: String,
  rollNumber: Number,
  adNumber: Number,
  class: Number,
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  dateOfBirth: { type: Date, required: false },
  // Semester-transition fields
  active: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  batchNumber: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", studentSchema);