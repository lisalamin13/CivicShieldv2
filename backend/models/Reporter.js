const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const reporterSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  reportCount: { type: Number, default: 0 },
}, { timestamps: true });

reporterSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

reporterSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

reporterSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Reporter', reporterSchema);
