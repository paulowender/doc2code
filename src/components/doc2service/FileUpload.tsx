'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { FileUp } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      
      if (!file) return;
      
      // Check file type
      const validTypes = ['application/json', 'text/plain'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.json') && !file.name.endsWith('.txt')) {
        toast.error('Please upload a JSON or TXT file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        onFileUpload(content);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsText(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <FileUp className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop a JSON or TXT file, or click to select'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          (Only JSON and TXT files, max 5MB)
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
