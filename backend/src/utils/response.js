/**
 * Send a consistent success envelope: { success, message?, data? }.
 * Errors use the same shape with success: false (see errorHandler).
 */
export const sendSuccess = (res, { statusCode = 200, message, data } = {}) =>
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
