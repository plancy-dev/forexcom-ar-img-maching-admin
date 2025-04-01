import { useState, useEffect } from 'react';
import { ImageMetadata, ImageRecord } from '../types';

interface ImageModalProps {
  image: ImageRecord;
  onClose: () => void;
  onOCR?: (image: ImageRecord) => Promise<void>;
  onFeatureExtraction?: (image: ImageRecord) => Promise<void>;
  isOcrLoading?: boolean;
  isFeatureExtracting?: boolean;
  signedUrl?: string;
}

export default function ImageModal({ 
  image, 
  onClose, 
  onOCR, 
  onFeatureExtraction,
  isOcrLoading, 
  isFeatureExtracting,
  signedUrl 
}: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'info' | 'ocr' | 'features'>('image');
  const [currentMetadata, setCurrentMetadata] = useState(() => 
    image.metadata ? JSON.parse(image.metadata) : {}
  );

  // OCR 처리 여부 확인 함수
  const isOCRProcessed = (metadata: ImageMetadata) => {
    return 'ocr' in metadata && 'ocrTimestamp' in metadata;
  };

  // 특징 분석 처리 여부 확인 함수
  const isFeatureProcessed = (metadata: ImageMetadata) => {
    return 'features' in metadata && 'featureTimestamp' in metadata;
  };

  useEffect(() => {
    setCurrentMetadata(image.metadata ? JSON.parse(image.metadata) : {});
  }, [image.metadata]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="flex items-center text-xl font-semibold text-gray-900">
            <span className="mr-2">{currentMetadata.originalName || '이미지 상세보기'}</span>
            {isOCRProcessed(currentMetadata) && (
              <span className="px-2 py-1 mr-2 text-xs text-green-800 bg-green-100 rounded-full">
                OCR 완료
              </span>
            )}
            {isFeatureProcessed(currentMetadata) && (
              <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">
                특징 분석 완료
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700"
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
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'features'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('features')}
          >
            특징 분석
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'image' && (
            <div className="flex items-center justify-center h-full">
              <img
                src={signedUrl || image.image_url}
                alt={currentMetadata.originalName || '이미지'}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-lg font-medium text-gray-900">기본 정보</h3>
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
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">OCR 처리 정보</h3>
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

              {currentMetadata.features && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">특징 분석 정보</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">처리 시간</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(currentMetadata.features.extractedAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">특징 벡터 크기</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentMetadata.features.mobileNetFeatures.length} 차원
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">추출된 텍스트</h3>
                {onOCR && !isOCRProcessed(currentMetadata) && (
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
                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    <pre className="p-4 font-mono text-sm text-gray-600 whitespace-pre-wrap bg-white border border-gray-200 rounded">
                      {currentMetadata.ocr}
                    </pre>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <p>텍스트가 발견되지 않았습니다.</p>
                      <p className="mt-2 text-sm">이미지에서 텍스트를 찾을 수 없습니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>OCR 처리가 되지 않았습니다.</p>
                  <p className="mt-2 text-sm">OCR 실행 버튼을 클릭하여 텍스트를 추출해주세요.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">이미지 특징 분석 결과</h3>
                {onFeatureExtraction && !isFeatureProcessed(currentMetadata) && (
                  <button
                    onClick={() => onFeatureExtraction(image)}
                    disabled={isFeatureExtracting}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isFeatureExtracting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {isFeatureExtracting ? (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        특징 분석 중...
                      </span>
                    ) : (
                      '특징 분석 실행'
                    )}
                  </button>
                )}
              </div>
              {isFeatureProcessed(currentMetadata) ? (
                <div className="space-y-6">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">MobileNet 특징 벡터</h4>
                    <div className="font-mono text-xs text-gray-500">
                      {currentMetadata.features.mobileNetFeatures.slice(0, 5).map((v: number, i: number) => (
                        <div key={i}>{v.toFixed(4)}</div>
                      ))}
                      <div className="mt-2 text-gray-400">... {currentMetadata.features.mobileNetFeatures.length - 5}개 더 있음</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">이미지 통계</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">평균값 (RGB)</dt>
                        <dd className="mt-1 text-xs text-gray-900">
                          {currentMetadata.features.mean.map((v: number) => v.toFixed(4)).join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">표준편차 (RGB)</dt>
                        <dd className="mt-1 text-xs text-gray-900">
                          {currentMetadata.features.std.map((v: number) => v.toFixed(4)).join(', ')}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">히스토그램</h4>
                    <div className="flex items-end h-32 space-x-1">
                      {currentMetadata.features.histogram.slice(0, 32).map((v: number, i: number) => (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500"
                          style={{ height: `${v * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>특징 분석이 되지 않았습니다.</p>
                  <p className="mt-2 text-sm">특징 추출 버튼을 클릭하여 이미지 특징을 분석해주세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 