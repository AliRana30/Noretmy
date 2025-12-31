'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  File,
  Film,
  Music,
  Archive,
  Download,
  Eye,
  X,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MessageAttachment {
  _id?: string;
  url: string;
  thumbnailUrl?: string;
  type?: string;
  name?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  publicId?: string;
  dimensions?: { width: number; height: number };
}

interface MessageAttachmentDisplayProps {
  attachments: MessageAttachment[];
  isSelf?: boolean;
}

const FILE_CATEGORIES: Record<string, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  image: { icon: ImageIcon, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  video: { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  audio: { icon: Music, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  document: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  archive: { icon: Archive, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  other: { icon: File, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

const MessageAttachmentDisplay: React.FC<MessageAttachmentDisplayProps> = ({
  attachments,
  isSelf = false
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!attachments || attachments.length === 0) return null;

  const getFileCategory = (attachment: MessageAttachment): string => {
    if (attachment.type) return attachment.type;
    
    const mimeType = attachment.mimeType || '';
    const name = attachment.name || attachment.originalName || '';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || 
        mimeType.includes('document') || 
        mimeType.includes('sheet') ||
        mimeType.includes('text/')) return 'document';
    if (mimeType.includes('zip') || 
        mimeType.includes('rar') || 
        mimeType.includes('compressed')) return 'archive';
    
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')) return 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'archive';
    
    return 'other';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryInfo = (category: string) => {
    return FILE_CATEGORIES[category] || FILE_CATEGORIES.other;
  };

  const imageAttachments = attachments.filter(a => getFileCategory(a) === 'image');
  const otherAttachments = attachments.filter(a => getFileCategory(a) !== 'image');

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev === 0 ? imageAttachments.length - 1 : prev - 1));
    } else {
      setLightboxIndex(prev => (prev === imageAttachments.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Image Gallery */}
      {imageAttachments.length > 0 && (
        <div className={`grid gap-1 ${
          imageAttachments.length === 1 ? 'grid-cols-1' :
          imageAttachments.length === 2 ? 'grid-cols-2' :
          imageAttachments.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 sm:grid-cols-3'
        }`}>
          {imageAttachments.map((attachment, index) => (
            <div
              key={attachment._id || index}
              className={`relative group cursor-pointer overflow-hidden rounded-lg ${
                imageAttachments.length === 1 ? 'max-w-xs' : 'aspect-square'
              }`}
              onClick={() => openLightbox(index)}
            >
              <img
                src={attachment.thumbnailUrl || attachment.url}
                alt={attachment.name || 'Image'}
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  imageAttachments.length === 1 ? 'rounded-lg max-h-64' : ''
                }`}
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(index);
                  }}
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
                <a
                  href={attachment.url}
                  download={attachment.name || attachment.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-4 h-4 text-gray-700" />
                </a>
              </div>
              {/* Image count badge for multiple images */}
              {imageAttachments.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{imageAttachments.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Other Files */}
      {otherAttachments.length > 0 && (
        <div className="space-y-1">
          {otherAttachments.map((attachment, index) => {
            const category = getFileCategory(attachment);
            const categoryInfo = getCategoryInfo(category);
            const IconComponent = categoryInfo.icon;
            const fileName = attachment.name || attachment.originalName || 'File';

            return (
              <a
                key={attachment._id || index}
                href={attachment.url}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelf 
                    ? 'bg-white/50 border-orange-200 hover:bg-white/70' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${categoryInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-5 h-5 ${categoryInfo.color}`} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(attachment.size)}
                    {attachment.mimeType && ` • ${attachment.mimeType.split('/')[1]?.toUpperCase()}`}
                  </p>
                </div>

                {/* Download Icon */}
                <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </a>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && imageAttachments.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation */}
          {imageAttachments.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          {/* Image */}
          <div 
            className="max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageAttachments[lightboxIndex].url}
              alt={imageAttachments[lightboxIndex].name || 'Image'}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            
            {/* Image Info */}
            <div className="mt-4 flex items-center justify-between text-white/70">
              <span className="text-sm">
                {lightboxIndex + 1} / {imageAttachments.length}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {imageAttachments[lightboxIndex].name || 'Image'}
                </span>
                <a
                  href={imageAttachments[lightboxIndex].url}
                  download={imageAttachments[lightboxIndex].name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <a
                  href={imageAttachments[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageAttachmentDisplay;
