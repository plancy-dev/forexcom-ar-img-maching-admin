import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageModal from './ImageModal';
import { ImageRecord } from '@/types';

interface DragDropUploadProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  onUpload: () => void;
  isUploading: boolean;
}

export default function DragDropUpload({ 
  onFileSelect, 
  selectedFiles, 
  onUpload,
  isUploading 
}: DragDropUploadProps) {
  const [previewImage, setPreviewImage] = useState<ImageRecord | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: isUploading
  });

  const handleImageClick = (file: File) => {
    const url = URL.createObjectURL(file);
    // 임시 ImageRecord 객체 생성
    const tempImage: ImageRecord = {
      id: 0,
      image_url: url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '0',
      metadata: JSON.stringify({
        originalName: file.name,
        size: file.size,
        type: file.type
      })
    };
    setPreviewImage(tempImage);
  };

  // 미리보기 URL 생성 및 정리
  useEffect(() => {
    const urls: Record<string, string> = {};
    selectedFiles.forEach(file => {
      urls[file.name] = URL.createObjectURL(file);
    });

    setPreviewUrls(urls);

    return () => {
      // 컴포넌트 언마운트 시 URL 정리
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            {isDragActive ? (
              <p>파일을 여기에 놓아주세요...</p>
            ) : isUploading ? (
              <p className="text-blue-600">업로드 중입니다...</p>
            ) : (
              <p>파일을 드래그하여 업로드하거나 클릭하여 선택하세요</p>
            )}
          </div>
          <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP 파일 지원</p>
        </div>
      </div>

      {/* 선택된 파일 목록 */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              선택된 파일 ({selectedFiles.length}개)
            </h3>
            <button
              onClick={onUpload}
              disabled={isUploading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
                ${isUploading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  업로드 중...
                </span>
              ) : (
                '업로드'
              )}
            </button>
          </div>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <div 
                    className="h-10 w-10 cursor-pointer flex-shrink-0"
                    onClick={() => handleImageClick(file)}
                  >
                    <img
                      src={previewUrls[file.name]}
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newFiles = [...selectedFiles];
                    newFiles.splice(index, 1);
                    onFileSelect(newFiles);
                  }}
                  disabled={isUploading}
                  className={`ml-4 flex-shrink-0 ${
                    isUploading 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewImage && (
        <ImageModal
          image={previewImage}
          onClose={() => {
            URL.revokeObjectURL(previewImage.image_url);
            setPreviewImage(null);
          }}
        />
      )}
    </div>
  );
} 