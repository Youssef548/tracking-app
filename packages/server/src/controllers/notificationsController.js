const Notification = require('../models/Notification');

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found', code: 'NOT_FOUND' } });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
