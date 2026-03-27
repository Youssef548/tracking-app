import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  code?: number | string;
  kind?: string;
  errors?: Record<string, { message: string }>;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err.stack ?? err.message);

  if (err.name === 'ValidationError') {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(err.errors ?? {})) {
      fields[key] = err.errors?.[key]?.message ?? 'Invalid';
    }
    res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields } });
    return;
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    res.status(400).json({ error: { message: 'Invalid ID format', code: 'INVALID_ID' } });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ error: { message: 'Duplicate entry', code: 'DUPLICATE' } });
    return;
  }

  const status = err.status ?? 500;
  const message = err.status ? err.message : 'Internal server error';
  res.status(status).json({ error: { message, code: err.code ?? 'SERVER_ERROR' } });
}

export default errorHandler;
