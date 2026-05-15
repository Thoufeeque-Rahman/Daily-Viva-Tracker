const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    loginAt: { type: Date, default: Date.now, index: true },
    logoutAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    authMethod: { type: String, enum: ["email", "username", "email_or_username"], default: "email_or_username" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
