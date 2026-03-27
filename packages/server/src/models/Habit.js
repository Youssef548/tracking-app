const mongoose = require('mongoose');
const { FREQUENCIES, COLORS, TRACKING_TYPES } = require('@mindful-flow/shared/constants');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Habit name is required'], trim: true, maxlength: 100 },
  icon: { type: String, default: 'check_circle' },
  color: { type: String, enum: COLORS, default: 'primary' },
  frequency: { type: String, enum: Object.values(FREQUENCIES), required: true },
  target: { type: Number, default: 1, min: 1, max: 7 },
  description: { type: String, default: '', maxlength: 255 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  trackingType: { type: String, enum: Object.values(TRACKING_TYPES), default: 'checkmark' },
  weeklyTarget: { type: Number, default: null, min: 1, max: 168 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);
