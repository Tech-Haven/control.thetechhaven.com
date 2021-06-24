const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log(err);

  if (err.response) {
    const { status, data } = err.response;

    if (status === 400) {
      if (data.badRequest) {
        error = new ErrorResponse(data.badRequest.message, status);
      } else {
        error = new ErrorResponse(err.response.statusText, status);
      }
    } else if (status === 401) {
      if (data.error.message === 'Could not recognize Fernet token') {
        error = new ErrorResponse('Invalid X-Auth-Token', code);
      } else {
        error = new ErrorResponse(data.error.message, status);
      }
    } else if (status === 404) {
      if (err.config.url.includes('os-keypairs')) {
        error = new ErrorResponse(
          'Please create a keypair before performing this request',
          status
        );
      } else if (data.itemNotFound) {
        error = new ErrorResponse(data.itemNotFound.message, status);
      } else if (data.error) {
        error = new ErrorResponse(data.error.message, status);
      } else {
        error = new ErrorResponse(err.response.statusText, status);
      }
    } else if (status === 409) {
      if (data.conflictingRequest) {
        error = new ErrorResponse(data.conflictingRequest.message, status);
      } else if (data.error) {
        error = new ErrorResponse(data.error.message, status);
      }
    }
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server Error' });
};

module.exports = errorHandler;
