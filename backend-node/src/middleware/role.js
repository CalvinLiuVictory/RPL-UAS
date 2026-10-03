import { HttpError } from '../utils/errors.js';

export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'Akses ditolak. Anda tidak memiliki izin.'));
    }
    next();
  };
}

export default roleMiddleware;
