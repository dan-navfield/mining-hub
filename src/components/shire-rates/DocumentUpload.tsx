'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { FileUploadProgress } from '@mining-hub/types';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  uploads: FileUploadProgress[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export function DocumentUpload({
  onUpload,
  onRemove,
  uploads,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/tiff',
  ],
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (uploads.length + acceptedFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles = acceptedFiles.filter(file => {
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [uploads.length, maxFiles, maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - uploads.length,
    maxSize,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('image')) return '🖼️';
    return '📄';
  };

  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 border-yellow-200';
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive || dragActive
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
          }
          ${uploads.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploads.length >= maxFiles} />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className={`w-12 h-12 ${isDragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Upload Shire Rates Documents'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop files here, or click to browse
            </p>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>Supported formats: PDF, DOC, DOCX, Images</p>
            <p>Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB</p>
            <p>Maximum files: {maxFiles} ({uploads.length} uploaded)</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Uploaded Files</h3>
          
          {uploads.map((upload, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-4 rounded-lg border
                ${getStatusColor(upload.status)}
              `}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-2xl">{getFileIcon(upload.file)}</div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {upload.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{upload.progress}% uploaded</p>
                    </div>
                  )}
                  
                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                  )}
                  
                  {upload.status === 'completed' && upload.result && (
                    <p className="text-xs text-green-600 mt-1">
                      Processing completed - {upload.result.ocrStatus}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(upload.status)}
                
                <button
                  onClick={() => onRemove(index)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  disabled={upload.status === 'uploading' || upload.status === 'processing'}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
