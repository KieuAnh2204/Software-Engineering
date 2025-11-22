const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message };

  // Log for debugging; keep the original stack
  console.error(err);

  if (err.name === 'CastError') {
    error = { message: 'Resource not found', statusCode: 404 };
  }

  if (err.code === 11000) {
    error = { message: 'Duplicate field value entered', statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = { message, statusCode: 400 };
  }

  const statusCode = error.statusCode || error.status || 500;
  const message = Array.isArray(error.message)
    ? error.message.join(', ')
    : error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
