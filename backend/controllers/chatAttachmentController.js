const ChatAttachment = require('../models/ChatAttachment');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { sendChatAttachmentEmail } = require('../services/emailService');

const cloudinary = require('../config/cloudinaryConfig');

let s3;
try {
  const { s3Client } = require('../config/s3Config');
  s3 = s3Client;
} catch (err) {
  }

/**
 * File type configuration
 */
const FILE_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFilesPerMessage: 10,
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf'
    ],
    archive: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip'
    ],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
  },
  blockedExtensions: [
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'vbs',
    'js', 'jar', 'sh', 'ps1', 'dll', 'sys', 'drv', 'inf'
  ]
};

/**
 * Get file type from MIME type
 */
const getFileType = (mimeType) => {
  for (const [type, mimes] of Object.entries(FILE_CONFIG.allowedMimeTypes)) {
    if (mimes.includes(mimeType)) return type;
  }
  return 'other';
};

/**
 * Validate file
 */
const validateFile = (file) => {
  if (file.size > FILE_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${FILE_CONFIG.maxFileSize / (1024 * 1024)}MB`
    };
  }

  const extension = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (FILE_CONFIG.blockedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed for security reasons`
    };
  }

  const fileType = getFileType(file.mimetype);
  const allAllowedMimes = Object.values(FILE_CONFIG.allowedMimeTypes).flat();
  
  if (fileType === 'other') {
    const blockedMimes = [
      'application/x-msdownload',
      'application/x-executable',
      'application/x-msdos-program'
    ];
    if (blockedMimes.some(m => file.mimetype.includes(m))) {
      return {
        valid: false,
        error: 'This file type is not allowed for security reasons'
      };
    }
  }

  return { valid: true };
};

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (file, conversationId) => {
  const folder = `chat_attachments/${conversationId}`;
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : 
                       file.mimetype.startsWith('audio/') ? 'video' : 'auto';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}_${uuidv4()}`,
        transformation: file.mimetype.startsWith('image/') ? [
          { quality: 'auto:good', fetch_format: 'auto' }
        ] : undefined
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    if (file.buffer) {
      uploadStream.end(file.buffer);
    } else {
      const fs = require('fs');
      fs.createReadStream(file.path).pipe(uploadStream);
    }
  });
};

/**
 * Upload files to a chat conversation
 */
const uploadChatFiles = async (req, res) => {
  try {
    const { conversationId, orderId, messageText } = req.body;
    const userId = req.userId;
    const files = req.files;

    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conversation ID is required' 
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files provided' 
      });
    }

    if (files.length > FILE_CONFIG.maxFilesPerMessage) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${FILE_CONFIG.maxFilesPerMessage} files allowed per message`
      });
    }

    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not part of this conversation' 
      });
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: validation.error,
          fileName: file.originalname
        });
      }
    }

    const uploadedFiles = [];
    const attachmentsForMessage = [];

    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file, conversationId);
        const fileType = getFileType(file.mimetype);

        const attachment = new ChatAttachment({
          messageId: null, // Will be updated after message creation
          conversationId,
          orderId: orderId || null,
          uploaderId: userId,
          fileName: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          fileType,
          storageProvider: 'cloudinary',
          storageUrl: result.secure_url,
          publicId: result.public_id,
          thumbnailUrl: fileType === 'image' ? 
            cloudinary.url(result.public_id, { 
              width: 200, 
              height: 200, 
              crop: 'thumb',
              quality: 'auto'
            }) : null,
          dimensions: result.width && result.height ? {
            width: result.width,
            height: result.height
          } : undefined,
          status: 'ready'
        });

        await attachment.save();
        uploadedFiles.push(attachment);

        attachmentsForMessage.push({
          _id: attachment._id,
          url: result.secure_url,
          thumbnailUrl: attachment.thumbnailUrl,
          type: fileType,
          name: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          publicId: result.public_id,
          dimensions: attachment.dimensions
        });

      } catch (uploadError) {
        console.error('[ChatAttachment] Upload error:', uploadError);
        uploadedFiles.push({
          error: true,
          fileName: file.originalname,
          message: uploadError.message
        });
      }
    }

    const message = new Message({
      conversationId,
      userId,
      desc: messageText || '',
      messageType: messageText ? 'text' : 'file',
      orderId: orderId || null,
      attachments: attachmentsForMessage,
      attachmentCount: attachmentsForMessage.length
    });

    await message.save();

    for (const attachment of uploadedFiles) {
      if (attachment._id) {
        await ChatAttachment.findByIdAndUpdate(attachment._id, { 
          messageId: message._id 
        });
      }
    }

    await Conversation.findOneAndUpdate(
      { id: conversationId },
      {
        lastMessage: messageText || `📎 ${attachmentsForMessage.length} file(s)`,
        readBySeller: userId === conversation.sellerId,
        readByBuyer: userId === conversation.buyerId
      }
    );

    try {
      const recipientId = userId === conversation.sellerId ? 
        conversation.buyerId : conversation.sellerId;
      const [sender, recipient] = await Promise.all([
        User.findById(userId),
        User.findById(recipientId)
      ]);
      
      if (recipient && recipient.email && sender) {
        sendChatAttachmentEmail(recipient.email, {
          senderName: sender.username || 'Someone',
          recipientName: recipient.username || recipient.email,
          conversationId,
          attachmentCount: attachmentsForMessage.length,
          attachmentNames: attachmentsForMessage.map(a => a.name).slice(0, 3) // First 3 file names
        }).catch(err => console.error("Error sending chat attachment email:", err));
      }
    } catch (emailError) {
      console.error("Error sending chat attachment email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        conversationId,
        userId,
        desc: message.desc,
        messageType: message.messageType,
        attachments: attachmentsForMessage,
        attachmentCount: message.attachmentCount,
        createdAt: message.createdAt
      },
      attachments: attachmentsForMessage,
      uploadedFiles: uploadedFiles.filter(f => !f.error).length,
      failedFiles: uploadedFiles.filter(f => f.error)
    });

  } catch (error) {
    console.error('[ChatAttachment] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload files' 
    });
  }
};

/**
 * Get attachments for a conversation
 */
const getConversationAttachments = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 20, type } = req.query;

    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = { 
      conversationId, 
      isDeleted: false,
      status: 'ready'
    };
    
    if (type && type !== 'all') {
      query.fileType = type;
    }

    const attachments = await ChatAttachment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('uploaderId', 'username profilePicture');

    const total = await ChatAttachment.countDocuments(query);

    res.status(200).json({
      success: true,
      attachments: attachments.map(a => ({
        id: a._id,
        url: a.storageUrl,
        thumbnailUrl: a.thumbnailUrl,
        type: a.fileType,
        name: a.originalName,
        size: a.fileSize,
        formattedSize: a.formattedSize,
        uploadedBy: a.uploaderId,
        createdAt: a.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[ChatAttachment] Error fetching attachments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attachments' });
  }
};

/**
 * Get single attachment with signed URL (for secure downloads)
 */
const getAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    const attachment = await ChatAttachment.findById(attachmentId);
    if (!attachment || attachment.isDeleted) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    const conversation = await Conversation.findOne({ id: attachment.conversationId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await attachment.recordDownload();

    res.status(200).json({
      success: true,
      attachment: {
        id: attachment._id,
        url: attachment.storageUrl,
        thumbnailUrl: attachment.thumbnailUrl,
        name: attachment.originalName,
        type: attachment.fileType,
        mimeType: attachment.mimeType,
        size: attachment.fileSize,
        formattedSize: attachment.formattedSize,
        dimensions: attachment.dimensions,
        downloadCount: attachment.downloadCount
      }
    });

  } catch (error) {
    console.error('[ChatAttachment] Error fetching attachment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attachment' });
  }
};

/**
 * Delete attachment (soft delete)
 */
const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    const attachment = await ChatAttachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    if (attachment.uploaderId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only uploader can delete' });
    }

    await attachment.softDelete(userId);

    if (attachment.messageId) {
      await Message.findByIdAndUpdate(attachment.messageId, {
        $inc: { attachmentCount: -1 }
      });
    }

    res.status(200).json({ success: true, message: 'Attachment deleted' });

  } catch (error) {
    console.error('[ChatAttachment] Error deleting attachment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete attachment' });
  }
};

/**
 * Get attachments for an order
 */
const getOrderAttachments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const attachments = await ChatAttachment.find({
      orderId,
      isDeleted: false,
      status: 'ready'
    })
    .sort({ createdAt: -1 })
    .populate('uploaderId', 'username profilePicture');

    res.status(200).json({
      success: true,
      attachments: attachments.map(a => ({
        id: a._id,
        url: a.storageUrl,
        thumbnailUrl: a.thumbnailUrl,
        type: a.fileType,
        name: a.originalName,
        size: a.fileSize,
        formattedSize: a.formattedSize,
        uploadedBy: a.uploaderId,
        conversationId: a.conversationId,
        createdAt: a.createdAt
      })),
      count: attachments.length
    });

  } catch (error) {
    console.error('[ChatAttachment] Error fetching order attachments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attachments' });
  }
};

/**
 * Upload files only (without creating a message)
 * Returns the uploaded file URLs for the client to use when sending a message
 */
const uploadFilesOnly = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.userId;
    const files = req.files;

    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conversation ID is required' 
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files provided' 
      });
    }

    if (files.length > FILE_CONFIG.maxFilesPerMessage) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${FILE_CONFIG.maxFilesPerMessage} files allowed per message`
      });
    }

    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not part of this conversation' 
      });
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: validation.error,
          fileName: file.originalname
        });
      }
    }

    const uploadedAttachments = [];

    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file, conversationId);
        const fileType = getFileType(file.mimetype);

        const attachmentData = {
          _id: new (require('mongoose').Types.ObjectId)(),
          url: result.secure_url,
          thumbnailUrl: fileType === 'image' ? 
            cloudinary.url(result.public_id, { 
              width: 200, 
              height: 200, 
              crop: 'thumb',
              quality: 'auto'
            }) : null,
          type: fileType,
          name: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          publicId: result.public_id,
          dimensions: result.width && result.height ? {
            width: result.width,
            height: result.height
          } : undefined
        };

        uploadedAttachments.push(attachmentData);

      } catch (uploadError) {
        console.error('[ChatAttachment] Upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: `Failed to upload ${file.originalname}: ${uploadError.message}`
        });
      }
    }

    res.status(200).json({
      success: true,
      attachments: uploadedAttachments,
      count: uploadedAttachments.length
    });

  } catch (error) {
    console.error('[ChatAttachment] Error uploading files:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload files' 
    });
  }
};

module.exports = {
  uploadChatFiles,
  uploadFilesOnly,
  getConversationAttachments,
  getAttachment,
  deleteAttachment,
  getOrderAttachments,
  FILE_CONFIG
};
