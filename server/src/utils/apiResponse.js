// server/src/utils/apiResponse.js — Standardized API Response Helpers

export const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const paginated = (res, data, pagination, message = 'Data fetched successfully') => {
  return res.status(200).json({ success: true, message, data, pagination });
};

export const created = (res, data, message = 'Created successfully') => {
  return res.status(201).json({ success: true, message, data });
};

export const noContent = (res) => res.status(204).send();

export const badRequest = (res, message = 'Bad request', errors = []) => {
  return res.status(400).json({ success: false, message, errors: errors.length ? errors : undefined });
};

export const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message, code: 'UNAUTHORIZED' });
};

export const forbidden = (res, message = 'Access denied') => {
  return res.status(403).json({ success: false, message, code: 'FORBIDDEN' });
};

export const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message, code: 'NOT_FOUND' });
};

export const conflict = (res, message = 'Conflict') => {
  return res.status(409).json({ success: false, message, code: 'CONFLICT' });
};

export const serverError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, message, code: 'INTERNAL_ERROR' });
};
