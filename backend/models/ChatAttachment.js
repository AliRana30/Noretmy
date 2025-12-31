// models/ChatAttachment.js
const mongoose = require('mongoose');

/**
 * Chat Attachment Schema
 * Handles file uploads within chat conversations
 * Supports images, documents, and other file types
 */
const chatAttachmentSchema = new mongoose.Schema({
  // Relationships
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    index: true
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  
  // File category
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'document', 'archive', 'video', 'audio', 'other']
  },
  
  // Storage information
  storageProvider: {
    type: String,
    required: true,
    enum: ['cloudinary', 's3', 'local'],
    default: 'cloudinary'
  },
  storageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: false  // For Cloudinary
  },
  s3Key: {
    type: String,
    required: false  // For S3
  },
  
  // Signed URL for secure access (optional, for S3)
  signedUrl: {
    type: String,
    required: false
  },
  signedUrlExpiresAt: {
    type: Date,
    required: false
  },
  
  // Image-specific fields
  thumbnailUrl: {
    type: String,
    required: false
  },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  
  // Security & scanning
  isScanned: {
    type: Boolean,
    default: false
  },
  isSafe: {
    type: Boolean,
    default: true
  },
  scanResult: {
    type: String,
    required: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed', 'deleted'],
    default: 'uploading'
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date,
    required: false
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    required: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
  
}, {
  timestamps: true
});

// Indexes
chatAttachmentSchema.index({ conversationId: 1, createdAt: -1 });
chatAttachmentSchema.index({ orderId: 1 });
chatAttachmentSchema.index({ uploaderId: 1 });
chatAttachmentSchema.index({ status: 1 });

// Virtual for file extension
chatAttachmentSchema.virtual('extension').get(function() {
  const parts = this.originalName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
});

// Virtual for formatted file size
chatAttachmentSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to get file type from MIME type
chatAttachmentSchema.statics.getFileTypeFromMime = function(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || 
      mimeType.includes('spreadsheet') || mimeType.includes('presentation') ||
      mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || 
      mimeType.includes('tar') || mimeType.includes('7z') ||
      mimeType.includes('compressed')) return 'archive';
  return 'other';
};

// Static method to check if file type is allowed
chatAttachmentSchema.statics.isAllowedFileType = function(mimeType, fileName) {
  // Blocked extensions
  const blockedExtensions = [
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'vbs', 
    'js', 'jar', 'sh', 'ps1', 'dll', 'sys', 'drv'
  ];
  
  // Blocked MIME types
  const blockedMimeTypes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-shellscript'
  ];
  
  // Check extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (blockedExtensions.includes(extension)) {
    return { allowed: false, reason: `File type .${extension} is not allowed for security reasons` };
  }
  
  // Check MIME type
  if (blockedMimeTypes.some(blocked => mimeType.includes(blocked))) {
    return { allowed: false, reason: 'This file type is not allowed for security reasons' };
  }
  
  return { allowed: true };
};

// Static: max file size in bytes (50MB)
chatAttachmentSchema.statics.MAX_FILE_SIZE = 50 * 1024 * 1024;

// Static: max files per message
chatAttachmentSchema.statics.MAX_FILES_PER_MESSAGE = 10;

// Instance method to soft delete
chatAttachmentSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'deleted';
  return this.save();
};

// Instance method to increment download count
chatAttachmentSchema.methods.recordDownload = async function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('ChatAttachment', chatAttachmentSchema);
