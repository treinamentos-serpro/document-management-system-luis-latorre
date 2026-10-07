const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const { createError } = require('./documentError');
const { maxFileSize, validateFileType, validateUploadedFile } = require('./documentFilePolicy');

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

async function uploadDocument(file, owner) {
  if (!file) {
    throw createError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }
  try {
    validateUploadedFile(file);
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