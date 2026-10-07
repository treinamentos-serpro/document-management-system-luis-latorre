const multer = require('multer');
const service = require('../services/documentService');

const receiveFile = multer({
  storage: service.createUploadStorage(),
  limits: {
    fileSize: service.maxFileSize + 1,
    files: 1,
    fields: 0,
    // O Busboy sinaliza partsLimit ao atingir a contagem configurada.
    parts: 2,
    fieldNameSize: 100,
    fieldSize: 1024,
    headerPairs: 100
  },
  fileFilter(req, file, callback) {
    try {
      service.validateFileType(file);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }
}).single('file');

function requireOwner(req, res, next) {
  const owner = (req.get('X-User-Id') || '').trim();
  if (!owner) {
    return next(service.createError(401, 'USER_REQUIRED', 'Informe o header X-User-Id.'));
  }
  if (owner.length > 128) {
    return next(service.createError(400, 'INVALID_USER', 'X-User-Id deve ter no maximo 128 caracteres.'));
  }
  req.owner = owner;
  next();
}

async function upload(req, res) {
  const document = await service.uploadDocument(req.file, req.owner);
  res.status(201).json({ document });
}

async function list(req, res) {
  const documents = await service.listDocuments(req.owner);
  res.json({ documents });
}

async function download(req, res, next) {
  const document = await service.downloadDocument(req.params.id, req.owner);
  res.download(document.filePath, document.originalName, (error) => {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      return next(service.createError(404, 'DOCUMENT_NOT_FOUND', 'Documento nao encontrado.'));
    }
    if (error) next(error);
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: tooLarge ? 'O arquivo excede o limite de 10 MiB.' : 'Envie somente um arquivo no campo file.'
      }
    });
  }

  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : error.code || 'INVALID_REQUEST',
      message: status === 500 ? 'Nao foi possivel concluir a operacao.' : error.message
    }
  });
}

module.exports = { requireOwner, receiveFile, upload, list, download, handleError };