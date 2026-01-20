import { useState } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Video } from 'lucide-react';
import api from '../services/api';

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

const FileUpload = ({ onUpload, multiple = false, accept, maxSize = 50 }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      
      if (multiple) {
        Array.from(files).forEach(file => {
          // Check file size
          if (file.size > maxSize * 1024 * 1024) {
            throw new Error(`File ${file.name} exceeds ${maxSize}MB limit`);
          }
          formData.append('files', file);
        });

        const response = await api.post('/upload/files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const uploaded = response.data.files;
        setUploadedFiles(prev => [...prev, ...uploaded]);
        onUpload(uploaded);
      } else {
        const file = files[0];
        
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File exceeds ${maxSize}MB limit`);
        }

        formData.append('file', file);

        const response = await api.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const uploaded = [response.data.file];
        setUploadedFiles(uploaded);
        onUpload(uploaded);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (filename: string) => {
    const updated = uploadedFiles.filter(f => f.filename !== filename);
    setUploadedFiles(updated);
    onUpload(updated);
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (mimetype.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimetype === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          onChange={handleFileSelect}
          multiple={multiple}
          accept={accept}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'bg-slate-100 cursor-not-allowed'
              : 'hover:bg-slate-50 hover:border-blue-500'
          }`}
        >
          <Upload className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-600">
            {uploading ? 'Uploading...' : multiple ? 'Upload Files' : 'Upload File'}
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.filename}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-slate-600">
                  {getFileIcon(file.mimetype)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(file.filename)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-500">
        Max file size: {maxSize}MB. Supported: Images, PDFs, Documents, Videos
      </p>
    </div>
  );
};

export default FileUpload;
