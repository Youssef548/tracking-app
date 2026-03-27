import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, type ValidationFn } from '../middleware/validate';
import { validateCompletionInput } from '@mindful-flow/shared/validation';
import { getCompletions, createCompletion, deleteCompletion } from '../controllers/completionsController';

const router = Router();

const completionValidator = validateCompletionInput as unknown as ValidationFn;

router.use(authenticate);
router.get('/', getCompletions);
router.post('/', validate(completionValidator), createCompletion);
router.delete('/:id', deleteCompletion);

export default router;
