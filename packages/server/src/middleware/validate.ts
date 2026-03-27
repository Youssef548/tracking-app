import { Request, Response, NextFunction } from 'express';

export type ValidationFn = (body: unknown, ...args: unknown[]) => { isValid: boolean; errors: Record<string, string> };

export function validate(validationFn: ValidationFn, ...args: unknown[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { isValid, errors } = validationFn(req.body, ...args);
    if (!isValid) {
      res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors } });
      return;
    }
    next();
  };
}

export default validate;
