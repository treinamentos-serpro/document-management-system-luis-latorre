const { randomUUID } = require('node:crypto');
const path = require('node:path');
const repository = require('../repositories/documentRepository');

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

function createError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

function validateFileType(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.has(extension) || allowedTypes.get(extension) !== file.mimetype) {
    throw createError(415, 'UNSUPPORTED_FILE_TYPE', 'Tipo de arquivo nao permitido.');
  }
}

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

async function uploadDocument(file, owner) {
  if (!file) {
    throw createError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }
  try {
    validateFileType(file);
    if (file.size === 0) {
      throw createError(400, 'EMPTY_FILE', 'O arquivo nao pode estar vazio.');
    }
    if (file.size > maxFileSize) {
      throw createError(413, 'FILE_TOO_LARGE', 'O arquivo excede o limite de 10 MiB.');
    }
    const document = await repository.save({
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename
    });
    return toPublicDocument(document);
  } catch (error) {
    await repository.removeFile(file.filename).catch(() => {});
    throw error;
  }
}

async function listDocuments(owner) {
  const documents = await repository.findByOwner(owner);
  return documents.map(toPublicDocument);
}

async function downloadDocument(id, owner) {
  const document = await repository.findById(id);
  if (!document || document.owner !== owner) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento nao encontrado.');
  }
  let filePath;
  try {
    filePath = await repository.locateFile(document.storedName);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento nao encontrado.');
    }
    throw error;
  }
  return {
    filePath,
    originalName: document.originalName
  };
}

module.exports = {
  maxFileSize,
  createUploadStorage: repository.createUploadStorage,
  createError,
  validateFileType,
  uploadDocument,
  listDocuments,
  downloadDocument
};