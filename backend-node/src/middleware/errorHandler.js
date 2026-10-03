import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  // CORS rejection
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({ message: 'Akses CORS ditolak.' });
  }

  // Zod validation errors -> Laravel 422 format
  if (err instanceof ZodError) {
    const errorsMap = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.') || 'general';
      if (!errorsMap[field]) {
        errorsMap[field] = [];
      }
      errorsMap[field].push(issue.message);
    }

    const fieldKeys = Object.keys(errorsMap);
    const firstField = fieldKeys[0];
    const firstMsg = errorsMap[firstField][0];
    const extraCount = fieldKeys.length - 1;
    const message = extraCount > 0 ? `${firstMsg} (and ${extraCount} more error)` : firstMsg;

    return res.status(422).json({
      message,
      errors: errorsMap,
    });
  }

  // Explicit HttpError
  if (err instanceof HttpError) {
    const payload = { message: err.message };
    if (err.errors) {
      payload.errors = err.errors;
    }
    return res.status(err.status).json(payload);
  }

  // Centralized 500 error: only {"message": "Server Error"} without stack trace
  console.error('[Unhandled Server Error]:', err.message);
  return res.status(500).json({ message: 'Server Error' });
}
