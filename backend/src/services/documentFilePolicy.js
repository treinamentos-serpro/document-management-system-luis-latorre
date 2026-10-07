const path = require('node:path');
const { createError } = require('./documentError');

const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Map([
  ['.pdf', 'application/pdf'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.xls', 'application/vnd.ms-excel'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['.ppt', 'application/vnd.ms-powerpoint'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
]);

function validateFileType(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.has(extension) || allowedTypes.get(extension) !== file.mimetype) {
    throw createError(415, 'UNSUPPORTED_FILE_TYPE', 'Tipo de arquivo nao permitido.');
  }
}

function validateUploadedFile(file) {
  validateFileType(file);
  if (file.size === 0) {
    throw createError(400, 'EMPTY_FILE', 'O arquivo nao pode estar vazio.');
  }
  if (file.size > maxFileSize) {
    throw createError(413, 'FILE_TOO_LARGE', 'O arquivo excede o limite de 10 MiB.');
  }
}

module.exports = { maxFileSize, validateFileType, validateUploadedFile };