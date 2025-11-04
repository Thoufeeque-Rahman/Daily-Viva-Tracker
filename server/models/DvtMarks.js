const mongoose = require("mongoose");

const dvtMarksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: Number,
    required: true
  },
  subject: String,
  adNumber: {
    type: Number,
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  mark: {
    type: Number,
    required: true,
    min: 0,
    max: 2 // 0: Poor, 1: Good, 2: Great
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  punishment: {
    type: String,
    required: false
  },
  tId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("DvtMark", dvtMarksSchema);