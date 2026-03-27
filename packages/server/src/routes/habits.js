const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateHabitInput } = require('@mindful-flow/shared/validation');
const { getHabits, createHabit, updateHabit, deleteHabit } = require('../controllers/habitsController');

router.use(auth);
router.get('/', getHabits);
router.post('/', validate(validateHabitInput), createHabit);
router.put('/:id', validate(validateHabitInput, true), updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
