import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, type ValidationFn } from '../middleware/validate';
import { validateCategoryInput } from '@mindful-flow/shared/validation';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoriesController';

const router = Router();

const categoryValidator = validateCategoryInput as unknown as ValidationFn;

router.use(authenticate);
router.get('/', getCategories);
router.post('/', validate(categoryValidator), createCategory);
router.put('/:id', validate(categoryValidator), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
