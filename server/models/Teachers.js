const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'super_admin'], default: 'teacher' },
    qualification: { type: String },
    dateOfBirth: { type: Date, required: false }, // Optional DOB field
    collegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: function() {
            // Super admin doesn't need college ID, but teachers do
            return this.role !== 'super_admin';
        }
    },
    subjectsTaught: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            class: { type: Number },
            subject: { type: String },
            periodsInSemester: { type: Number }
        }
    ],
    joinedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    mustUpdateCredentials: { type: Boolean, default: true }
});

teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("Teacher", teacherSchema);