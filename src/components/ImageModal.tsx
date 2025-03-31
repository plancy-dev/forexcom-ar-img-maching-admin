import { useState, useEffect } from 'react';
import { ImageRecord } from '../types';

interface ImageModalProps {
  image: ImageRecord;
  onClose: () => void;
  onOCR?: (image: ImageRecord) => Promise<void>;
  isOcrLoading?: boolean;
  signedUrl?: string;
}

export default function ImageModal({ image, onClose, onOCR, isOcrLoading, signedUrl }: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'info' | 'ocr'>('image');
  const [currentMetadata, setCurrentMetadata] = useState(() => 
    image.metadata ? JSON.parse(image.metadata) : {}
  );

  // OCR 처리 여부 확인 함수
  const isOCRProcessed = (metadata: any) => {
    return 'ocr' in metadata && 'ocrTimestamp' in metadata;
  };


  useEffect(() => {
    setCurrentMetadata(image.metadata ? JSON.parse(image.metadata) : {});
  }, [image.metadata]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
        <span className="mr-2">{currentMetadata.originalName || '이미지 상세보기'}</span>
          {isOCRProcessed(currentMetadata) && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              OCR 완료
            </span>
          )}
        </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'image'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('image')}
          >
            이미지
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('info')}
          >
            파일 정보
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ocr'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('ocr')}
          >
            OCR 결과
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'image' && (
            <div className="flex items-center justify-center h-full">
              <img
                src={signedUrl || image.image_url}
                alt={currentMetadata.originalName || '이미지'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">파일명</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentMetadata.originalName || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">크기</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentMetadata.size ? `${(currentMetadata.size / 1024).toFixed(2)} KB` : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">타입</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentMetadata.type || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">업로드일</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(image.created_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {currentMetadata.ocrDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">OCR 처리 정보</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">처리 시간</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(currentMetadata.ocrTimestamp).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">신뢰도</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentMetadata.ocrDetails.confidence ? `${(currentMetadata.ocrDetails.confidence * 100).toFixed(1)}%` : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">감지된 언어</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentMetadata.ocrDetails.languageCode}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        {activeTab === 'ocr' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">추출된 텍스트</h3>
                {onOCR && (
                  <button
                    onClick={() => onOCR(image)}
                    disabled={isOcrLoading}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isOcrLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isOcrLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        OCR 처리 중...
                      </span>
                    ) : (
                      'OCR 실행'
                    )}
                  </button>
                )}
              </div>
              {isOCRProcessed(currentMetadata) ? (
                <div>
                  {currentMetadata.ocr ? (
                    <pre className="whitespace-pre-wrap text-gray-600 bg-white p-4 rounded border border-gray-200 font-mono text-sm">
                      {currentMetadata.ocr}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>텍스트가 발견되지 않았습니다.</p>
                      <p className="text-sm mt-2">이미지에서 텍스트를 찾을 수 없습니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>OCR 처리가 되지 않았습니다.</p>
                  <p className="text-sm mt-2">OCR 실행 버튼을 클릭하여 텍스트를 추출해주세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 