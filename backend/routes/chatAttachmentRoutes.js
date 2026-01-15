const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/jwt');
const {
  uploadChatFiles,
  uploadFilesOnly,
  getConversationAttachments,
  getAttachment,
  deleteAttachment,
  getOrderAttachments,
  FILE_CONFIG
} = require('../controllers/chatAttachmentController');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  const blockedExtensions = ['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'vbs', 'js', 'jar', 'sh', 'ps1', 'dll', 'sys'];
  
  if (blockedExtensions.includes(extension)) {
    cb(new Error(`File type .${extension} is not allowed`), false);
    return;
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONFIG.maxFileSize,
    files: FILE_CONFIG.maxFilesPerMessage
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${FILE_CONFIG.maxFileSize / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum is ${FILE_CONFIG.maxFilesPerMessage} files per message`
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

/**
 * @route   POST /api/chat-attachments/upload
 * @desc    Upload files to a chat conversation (creates message with attachments)
 * @access  Private
 */
router.post(
  '/upload',
  verifyToken,
  upload.array('files', FILE_CONFIG.maxFilesPerMessage),
  handleMulterError,
  uploadChatFiles
);

/**
 * @route   POST /api/chat-attachments/upload-only
 * @desc    Upload files only (returns attachment URLs without creating a message)
 * @access  Private
 */
router.post(
  '/upload-only',
  verifyToken,
  upload.array('files', FILE_CONFIG.maxFilesPerMessage),
  handleMulterError,
  uploadFilesOnly
);

/**
 * @route   GET /api/chat-attachments/conversation/:conversationId
 * @desc    Get all attachments for a conversation
 * @access  Private
 */
router.get(
  '/conversation/:conversationId',
  verifyToken,
  getConversationAttachments
);

/**
 * @route   GET /api/chat-attachments/:attachmentId
 * @desc    Get single attachment details
 * @access  Private
 */
router.get(
  '/:attachmentId',
  verifyToken,
  getAttachment
);

/**
 * @route   DELETE /api/chat-attachments/:attachmentId
 * @desc    Delete an attachment (soft delete)
 * @access  Private (uploader only)
 */
router.delete(
  '/:attachmentId',
  verifyToken,
  deleteAttachment
);

/**
 * @route   GET /api/chat-attachments/order/:orderId
 * @desc    Get all attachments related to an order
 * @access  Private
 */
router.get(
  '/order/:orderId',
  verifyToken,
  getOrderAttachments
);

module.exports = router;
