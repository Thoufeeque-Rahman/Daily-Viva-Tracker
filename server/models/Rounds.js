const mongoose = require("mongoose");

const RoundsSchema = new mongoose.Schema(
  {
    class: { type: Number, required: true },
    subject: { type: String, required: true },
    roundNumber: { type: Number, default: 1 },
    studentsNotAsked: { type: [String], default: [] },
    studentsAsked: { type: [String], default: [] },
    totalStudents: { type: Number, required: true },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    isCompleted: { type: Boolean, default: false },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Round", RoundsSchema);
