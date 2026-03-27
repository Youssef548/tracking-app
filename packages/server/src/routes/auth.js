const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validateAuthInput, validateProfileInput } = require('@mindful-flow/shared/validation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { register, login, getMe, updateProfile } = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMIT' } },
  skip: () => process.env.NODE_ENV === 'test' || process.env.E2E === 'true',
});

router.post('/register', authLimiter, validate(validateAuthInput, false), register);
router.post('/login', authLimiter, validate(validateAuthInput, true), login);
router.get('/me', auth, getMe);
router.put('/profile', auth, validate(validateProfileInput), updateProfile);

module.exports = router;
