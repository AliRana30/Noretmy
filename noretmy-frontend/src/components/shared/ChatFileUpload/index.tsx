'use client';

import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Paperclip,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Film,
  Music,
  Archive,
  Loader2,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';

interface ChatFileUploadProps {
  conversationId: string;
  orderId?: string;
  onUploadComplete: (attachments: AttachmentData[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

interface AttachmentData {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  publicId: string;
  dimensions?: { width: number; height: number };
}

interface FilePreview {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const FILE_CATEGORIES: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  image: { icon: ImageIcon, color: 'text-orange-500' },
  video: { icon: Film, color: 'text-purple-500' },
  audio: { icon: Music, color: 'text-orange-500' },
  document: { icon: FileText, color: 'text-blue-500' },
  archive: { icon: Archive, color: 'text-amber-500' },
  other: { icon: File, color: 'text-gray-500' }
};

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv',
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  '.mp3', '.wav', '.ogg', '.m4a',
  '.zip', '.rar', '.7z', '.tar', '.gz'
];

const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.scr', '.com',
  '.vbs', '.js', '.jar', '.php', '.py', '.rb', '.pl'
];

const ChatFileUpload: React.FC<ChatFileUploadProps> = ({
  conversationId,
  orderId,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50,
  disabled = false
}) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (mimeType: string, fileName: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || 
        mimeType.includes('document') || 
        mimeType.includes('sheet') ||
        mimeType.includes('presentation') ||
        mimeType.includes('text/')) return 'document';
    if (mimeType.includes('zip') || 
        mimeType.includes('rar') || 
        mimeType.includes('compressed') ||
        mimeType.includes('archive')) return 'archive';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')) return 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'archive';
    
    return 'other';
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File type ${ext} is not allowed for security reasons` };
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return { valid: false, error: `File exceeds ${maxFileSize}MB limit` };
    }

    if (files.length >= maxFiles) {
      return { valid: false, error: `Maximum ${maxFiles} files allowed` };
    }

    return { valid: true };
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        return;
      }

      const filePreview: FilePreview = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: getFileCategory(file.type, file.name),
        uploading: false,
        progress: 0
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === filePreview.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(filePreview);
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
      setShowUploadModal(true);
    }
  }, [files.length, maxFiles, maxFileSize]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setShowUploadModal(false);
      }
      return updated;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedAttachments: AttachmentData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const filePreview = files[i];
        
        setFiles(prev => prev.map(f => 
          f.id === filePreview.id ? { ...f, uploading: true } : f
        ));

        const formData = new FormData();
        formData.append('files', filePreview.file);
        formData.append('conversationId', conversationId);
        if (orderId) {
          formData.append('orderId', orderId);
        }

        try {
          const response = await axios.post(
            `${BACKEND_URL}/chat-attachments/upload-only`,
            formData,
            {
              withCredentials: true,
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                const progress = progressEvent.total 
                  ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                  : 0;
                setFiles(prev => prev.map(f => 
                  f.id === filePreview.id ? { ...f, progress } : f
                ));
              }
            }
          );

          if (response.data.success && response.data.attachments) {
            uploadedAttachments.push(...response.data.attachments);
          }

          setFiles(prev => prev.map(f => 
            f.id === filePreview.id ? { ...f, uploading: false, progress: 100 } : f
          ));
        } catch (error: any) {
          const errorMsg = error.response?.data?.error || 'Upload failed';
          setFiles(prev => prev.map(f => 
            f.id === filePreview.id ? { ...f, uploading: false, error: errorMsg } : f
          ));
          toast.error(`Failed to upload ${filePreview.name}: ${errorMsg}`);
        }
      }

      if (uploadedAttachments.length > 0) {
        onUploadComplete(uploadedAttachments);
        toast.success(`${uploadedAttachments.length} file(s) uploaded successfully`);
        setFiles([]);
        setShowUploadModal(false);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryInfo = (type: string) => {
    return FILE_CATEGORIES[type] || FILE_CATEGORIES.other;
  };

  return (
    <>
      {/* Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50"
        aria-label="Attach files"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        accept={ALLOWED_EXTENSIONS.join(',')}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
              <button
                onClick={() => {
                  setFiles([]);
                  setShowUploadModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drop Zone / File List */}
            <div className="p-6">
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-colors ${
                  isDragging 
                    ? 'border-orange-400 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-2 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 mb-1">
                  Drag & drop files here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-400">
                  Max {maxFileSize}MB per file • Up to {maxFiles} files
                </p>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file) => {
                    const categoryInfo = getCategoryInfo(file.type);
                    const IconComponent = categoryInfo.icon;

                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          file.error ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        {/* Preview or Icon */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconComponent className={`w-5 h-5 ${categoryInfo.color}`} />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                            {file.uploading && (
                              <span className="text-xs text-orange-500">{file.progress}%</span>
                            )}
                            {file.error && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {file.error}
                              </span>
                            )}
                          </div>
                          {/* Progress Bar */}
                          {file.uploading && (
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                              <div
                                className="h-full bg-orange-500 rounded-full transition-all"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {!file.uploading && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFiles([]);
                    setShowUploadModal(false);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadFiles}
                  disabled={isUploading || files.length === 0}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatFileUpload;
