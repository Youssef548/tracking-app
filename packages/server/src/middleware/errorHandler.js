function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    const fields = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields } });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: { message: 'Invalid ID format', code: 'INVALID_ID' } });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'Duplicate entry', code: 'DUPLICATE' } });
  }

  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal server error';
  res.status(status).json({ error: { message, code: err.code || 'SERVER_ERROR' } });
}

module.exports = errorHandler;
