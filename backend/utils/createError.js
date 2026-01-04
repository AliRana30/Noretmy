const createError = (statusOrMessage, message) => {
  const err = new Error();
  
  // If only one argument is provided, treat it as the message
  if (message === undefined) {
    err.message = statusOrMessage;
    err.status = 500; // Default status
  } else {
    // Two arguments: status and message
    err.status = statusOrMessage;
    err.message = message;
  }

  return err;
};

module.exports = createError;