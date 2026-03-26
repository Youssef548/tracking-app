const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  value: { type: Number, default: 1, min: 0 },
  note: { type: String, default: '', maxlength: 500 },
  completedAt: { type: Date, default: Date.now },
});

completionSchema.index({ userId: 1, date: 1 });
completionSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Completion', completionSchema);
