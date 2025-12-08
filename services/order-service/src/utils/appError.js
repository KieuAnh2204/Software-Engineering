class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new AppError(message, 400);
  }

  static unauthorized(message) {
    return new AppError(message, 401);
  }

  static forbidden(message) {
    return new AppError(message, 403);
  }

  static notFound(message) {
    return new AppError(message, 404);
  }
}

module.exports = { AppError };
