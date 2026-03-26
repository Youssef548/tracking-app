function validate(validationFn, ...args) {
  return (req, res, next) => {
    const { isValid, errors } = validationFn(req.body, ...args);
    if (!isValid) {
      return res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors } });
    }
    next();
  };
}

module.exports = validate;
