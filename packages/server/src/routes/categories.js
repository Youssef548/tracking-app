const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCategoryInput } = require('@mindful-flow/shared/validation');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoriesController');

router.use(auth);
router.get('/', getCategories);
router.post('/', validate(validateCategoryInput), createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
