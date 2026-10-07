const express = require('express');
const controller = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', controller.requireOwner, controller.receiveFile, controller.upload);
router.get('/documents', controller.requireOwner, controller.list);
router.get('/documents/:id/download', controller.requireOwner, controller.download);

module.exports = router;