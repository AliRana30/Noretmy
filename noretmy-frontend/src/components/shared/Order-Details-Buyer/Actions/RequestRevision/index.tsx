import React, { useState, useRef } from 'react';
import { FileUp, X, Paperclip } from 'lucide-react';

interface FileAttachment {
  id: string;
  file: File;
  name: string;
}

interface RequestRevisionProps {
  onRevisionSubmit: (reason: string, attachments?: File[]) => void;
  onClose: () => void;
  maxFileSize?: number; // in bytes, default 5MB
  allowedFileTypes?: string[]; // default ['.pdf', '.doc', '.docx', '.jpg', '.png']
}

const RequestRevision: React.FC<RequestRevisionProps> = ({
  onRevisionSubmit,
  onClose,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png']
}) => {
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: FileAttachment[] = [];
      
      Array.from(files).forEach((file) => {
        if (file.size > maxFileSize) {
          alert(`File ${file.name} exceeds the maximum file size of ${maxFileSize / 1024 / 1024}MB`);
          return;
        }


        newAttachments.push({
          id: Date.now().toString() + Math.random().toString(),
          file,
          name: file.name
        });
      });

      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (reason.trim()) {
      const attachmentFiles = attachments.map(a => a.file);
      onRevisionSubmit(reason, attachmentFiles.length > 0 ? attachmentFiles : undefined);
    } else {
      alert('Please provide a reason for the revision request.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-6 p-6 mx-auto">
      <p className="text-sm text-gray-700 mb-6">
        Please provide the details for the revision request. Make sure to be clear and specific.
      </p>

      {/* Revision Reason Input */}
      <textarea
        placeholder="Enter your revision request here..."
        className="w-full p-4 border rounded-lg text-gray-700 mb-4 h-32 resize-none"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {/* File Attachment Section */}
      <div className="mb-4">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <button
          onClick={triggerFileInput}
          className="flex items-center text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors mb-2"
        >
          <Paperclip className="mr-2 h-5 w-5" />
          Attach Files
        </button>

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className="flex items-center justify-between bg-gray-100 p-2 rounded-lg"
              >
                <span className="text-sm text-gray-700 truncate max-w-[70%]">
                  {attachment.name}
                </span>
                <button 
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-red-500 hover:bg-red-100 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit and Close Buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-all ease-in-out"
        >
          Close
        </button>
        <button
          onClick={handleSubmit}
          className="bg-gray-800 hover:bg-gray-900 transition-all text-white py-4 px-5 rounded-lg shadow-md flex items-center justify-center gap-3 font-medium"
        >
          Submit Revision Request
        </button>
      </div>
    </div>
  );
};

export default RequestRevision;

