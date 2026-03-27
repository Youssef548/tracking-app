// packages/server/src/utils/createNotification.js
const Notification = require('../models/Notification');

async function createNotification(userId, type, title, message) {
  try {
    await Notification.create({ userId, type, title, message });
  } catch (_) {
    // Fire-and-forget — notification failures must never affect the main request
  }
}

module.exports = { createNotification };
