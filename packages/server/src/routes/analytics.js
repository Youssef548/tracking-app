const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics } = require('../controllers/analyticsController');

router.use(auth);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/habits/:id', getHabitAnalytics);

module.exports = router;
