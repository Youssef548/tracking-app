import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, type ValidationFn } from '../middleware/validate';
import { validateHabitInput } from '@mindful-flow/shared/validation';
import { getHabits, createHabit, updateHabit, deleteHabit } from '../controllers/habitsController';

const router = Router();

const habitValidator = validateHabitInput as unknown as ValidationFn;

router.use(authenticate);
router.get('/', getHabits);
router.post('/', validate(habitValidator), createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

export default router;
