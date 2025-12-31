import React from 'react';
import {
  File,
  FileText,
  ImageIcon,
  FileArchive,
  VideoIcon,
  MusicIcon,
  Link2,
} from 'lucide-react';

interface ViewRequirementsProps {
  requirements: string;
  attachments?: string[];
  onClose: () => void;
}

// Helper function to determine icon based on file extension
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return {
        icon: <FileArchive className="text-red-500" />,
        color: 'text-red-500',
      };
    case 'txt':
      return {
        icon: <FileText className="text-blue-500" />,
        color: 'text-blue-500',
      };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return {
        icon: <ImageIcon className="text-orange-500" />,
        color: 'text-orange-500',
      };
    case 'mp4':
    case 'avi':
    case 'mov':
      return {
        icon: <VideoIcon className="text-purple-500" />,
        color: 'text-purple-500',
      };
    case 'mp3':
    case 'wav':
      return {
        icon: <MusicIcon className="text-indigo-500" />,
        color: 'text-indigo-500',
      };
    default:
      return {
        icon: <File className="text-gray-500" />,
        color: 'text-gray-500',
      };
  }
};

const ViewRequirements: React.FC<ViewRequirementsProps> = ({
  requirements,
  attachments,
  onClose,
}) => {
  return (
    <div className="mt-6 p-6 border rounded-xl">
      <p className="text-base text-gray-700 mb-6">
        Below are the requirements submitted by the buyer for this order.
      </p>

      {/* Requirements Content */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 mb-4 max-h-64 overflow-auto shadow-sm">
        {requirements ? (
          <p className="text-gray-800">{requirements}</p>
        ) : (
          <p className="text-gray-500 italic">No requirements submitted yet.</p>
        )}
      </div>

      {/* Attachments Section */}
      {attachments && attachments.length > 0 && (
  <div className="mt-4 flex flex-wrap gap-4">
    {attachments.map((attachment, index) => {
      const filename = attachment.split('/').pop() || `Attachment ${index + 1}`;
      const { icon } = getFileIcon(filename);

      const displayName = filename.length > 20 ? filename.slice(0, 20) + "..." : filename;

      return (
        <div
          key={index}
          className="w-20 flex flex-col items-center text-center group"
        >
          <a
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-1 hover:opacity-80 transition"
          >
            <div className="text-4xl">
              {icon}
            </div>
            <div className="text-xs text-gray-600 break-words">
              {displayName}
            </div>
          </a>
        </div>
      );
    })}
  </div>
)}


    </div>
  );
};

export default ViewRequirements;
