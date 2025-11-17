'use client';

import { useState, useRef } from "react";
import { showError } from "@/lib/toast";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  currentFile?: File | null;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  required?: boolean;
}

export default function FileUploadWithPreview({
  onFileSelect,
  currentFile,
  accept = "*/*",
  maxSize = 10,
  label = "Upload File",
  required = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      showError(`File terlalu besar! Maksimal ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'zip':
      case 'rar': return '📦';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <label className="label">
        <span className="label-text font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <span className="label-text-alt text-gray-500">Max {maxSize}MB</span>
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />

      {currentFile ? (
        // File selected view
        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded border-2 border-purple-300"
                />
              ) : (
                <div className="text-4xl">{getFileIcon(currentFile.name)}</div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={openFilePicker}
                  title="Ganti file"
                >
                  🔄
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-error"
                  onClick={handleRemove}
                  title="Hapus file"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Drag & drop zone
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <div className="text-5xl mb-3">
            {isDragging ? '📥' : '📤'}
          </div>
          <p className="font-medium text-gray-700 mb-1">
            {isDragging ? 'Drop file di sini' : 'Drag & drop file atau klik untuk memilih'}
          </p>
          <p className="text-sm text-gray-500">
            Ukuran maksimal: {maxSize}MB
          </p>
        </div>
      )}
    </div>
  );
}
