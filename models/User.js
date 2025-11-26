const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  }
}, {
  timestamps: true
});

// Plain-text password comparison (no encryption)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

module.exports = mongoose.model('User', userSchema);

