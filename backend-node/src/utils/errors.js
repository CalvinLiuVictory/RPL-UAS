export class HttpError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function validationError(errorsMap, firstMsg = null) {
  const keys = Object.keys(errorsMap);
  let message = firstMsg;
  if (!message) {
    const firstField = keys[0];
    const firstError = errorsMap[firstField]?.[0] || 'Validation error';
    const remainingCount = keys.length - 1;
    message = remainingCount > 0 ? `${firstError} (and ${remainingCount} more error)` : firstError;
  }
  return new HttpError(422, message, errorsMap);
}
