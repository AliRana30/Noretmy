const createError = (statusOrMessage, message) => {
  const err = new Error();
  
  if (message === undefined) {
    err.message = statusOrMessage;
    err.status = 500; // Default status
  } else {
    err.status = statusOrMessage;
    err.message = message;
  }

  return err;
};

module.exports = createError;