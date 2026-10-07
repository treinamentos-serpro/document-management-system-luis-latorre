const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function createUploadStorage() {
  return multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true })
        .then(() => callback(null, storageDirectory), callback);
    },
    filename(req, file, callback) {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
  });
}

function save(document) {
  documents.set(document.id, { ...document });
  return { ...document };
}

function findByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function getFilePath(storedName) {
  if (typeof storedName !== 'string' || !storedName || path.basename(storedName) !== storedName) {
    throw Object.assign(new Error('Nome interno de arquivo invalido.'), { code: 'INVALID_STORED_NAME' });
  }

  const filePath = path.resolve(storageDirectory, storedName);
  const relativePath = path.relative(storageDirectory, filePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw Object.assign(new Error('Nome interno de arquivo invalido.'), { code: 'INVALID_STORED_NAME' });
  }
  return filePath;
}

async function removeFile(storedName) {
  await fs.unlink(getFilePath(storedName));
}

async function locateFile(storedName) {
  const filePath = getFilePath(storedName);
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) {
    const error = new Error('Arquivo indisponivel.');
    error.code = 'ENOENT';
    throw error;
  }
  return filePath;
}

module.exports = { createUploadStorage, save, findByOwner, findById, removeFile, locateFile };