/**
 * An expected ("operational") error that carries an HTTP status code.
 * Throw it from anywhere; the central error handler turns it into a JSON response.
 */
export default class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message    Safe-to-expose message for the client
   * @param {Array<{field: string, message: string}>} [errors] Field-level details
   */
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }
}
