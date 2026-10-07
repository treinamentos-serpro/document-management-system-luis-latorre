function createError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

module.exports = { createError };