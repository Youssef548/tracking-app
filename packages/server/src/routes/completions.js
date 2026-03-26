const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCompletionInput } = require('@mindful-flow/shared/validation');
const { getCompletions, createCompletion, deleteCompletion } = require('../controllers/completionsController');

router.use(auth);
router.get('/', getCompletions);
router.post('/', validate(validateCompletionInput), createCompletion);
router.delete('/:id', deleteCompletion);

module.exports = router;
