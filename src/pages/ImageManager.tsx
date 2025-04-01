import  {  useState, useCallback, useMemo } from "react";

import ImageModal from "../components/ImageModal";
import { ImageRecord, ImageMetadata } from "../types";
import DragDropUpload from "../components/DragDropUpload";
import { toast } from 'react-toastify';
import { useImages } from '../hooks/useImages';
import { useImageMutations } from '../hooks/useImageMutations';
import { useOCR } from '../hooks/useOCR';
import { useSignedUrls } from '../hooks/useSignedUrls';
import { useQueryClient } from "@tanstack/react-query";
import { useFeatureExtraction } from '../hooks/useFeatureExtraction';


const ITEMS_PER_PAGE = 10;

export default function ImageManager() {
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isFeatureExtracting, setIsFeatureExtracting] = useState<Record<number, boolean>>({});

  const { data: imagesData, isLoading } = useImages(currentPage, ITEMS_PER_PAGE);
  const { uploadMutation, deleteMutation } = useImageMutations();
  const images = imagesData?.images || [];
  const totalPages = imagesData?.totalPages || 1;

  // 이미지 메타데이터 파싱을 메모이제이션
  const parsedMetadata = useMemo(() => {
    return images.reduce((acc: Record<number, ImageMetadata>, img: ImageRecord) => {
      acc[img.id] = img.metadata ? JSON.parse(img.metadata) : {};
      return acc;
    }, {});
  }, [images]);

  const signedUrls = useSignedUrls(images);

  // OCR 성공 후 selectedImage 갱신을 위한 콜백
  const handleOCRSuccess = useCallback((updatedImage: ImageRecord) => {
    setSelectedImage(updatedImage);
  }, []);

  const ocrMutation = useOCR(parsedMetadata, handleOCRSuccess);
  const featureExtractionMutation = useFeatureExtraction();

  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) {
      toast.error("파일을 선택해주세요!");
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(selectedFiles, {
      onSuccess: () => {
        setIsUploading(false);
        setSelectedFiles([]);
      },
      onError: () => {
        setIsUploading(false);
      }
    });
  }, [selectedFiles, uploadMutation]);


  const handleOCR = useCallback(async (image: ImageRecord) => {
    try {
      const imageUrl = signedUrls.data?.[image.id] || image.image_url;
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`이미지를 가져오는데 실패했습니다: ${response.status}`);
      }
      
      const blob = await response.blob();
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const base64Content = base64Image.split(',')[1];
      
      ocrMutation.mutate({ image, base64Content });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("OCR 오류:", error);
        toast.error(error.message || "OCR 처리 중 오류가 발생했습니다.");
      } else {
        console.error("OCR 오류:", error);
        toast.error("OCR 처리 중 오류가 발생했습니다.");
      }
    }
  }, [signedUrls.data]);

  const handleFeatureExtraction = useCallback(async (image: ImageRecord) => {
    try {
      setIsFeatureExtracting(prev => ({ ...prev, [image.id]: true }));
      featureExtractionMutation.mutate({ image });
    } catch (error) {
      console.error('특징 추출 오류:', error);
      toast.error('이미지 특징 추출 중 오류가 발생했습니다.');
    } finally {
      setIsFeatureExtracting(prev => ({ ...prev, [image.id]: false }));
    }
  }, [featureExtractionMutation]);

  // 테이블 행 컴포넌트 분리
  const ImageRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-16 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-5 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-x-2">
          <div className="inline-block w-20 h-8 bg-gray-200 rounded"></div>
          <div className="inline-block w-12 h-8 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );
  const ImageRow = useCallback(({ img }: { img: ImageRecord }) => {
    const metadata = parsedMetadata[img.id];
    const isOCRProcessed = 'ocr' in metadata && 'ocrTimestamp' in metadata;
    const isFeatureProcessed = 'features' in metadata && 'featureTimestamp' in metadata;
    
    const handleImageClick = () => {
      const updatedImage = images.find(image => image.id === img.id);
      if (updatedImage) {
        setSelectedImage(updatedImage);
      }
    };
  
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div 
            className="w-16 h-16 cursor-pointer"
            onClick={handleImageClick}
          >
            {signedUrls.isLoading ? (
              <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
            ) : signedUrls.data?.[img.id] ? (
              <img
                src={signedUrls.data[img.id]}
                alt={metadata.originalName || '이미지'}
                className="object-cover w-16 h-16 rounded"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded">
                <span className="text-gray-400">오류</span>
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {metadata.originalName || '이미지'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {new Date(img.created_at).toLocaleString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            isFeatureProcessed
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isFeatureProcessed ? '특징 추출 완료' : '미처리'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            isOCRProcessed
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isOCRProcessed ? 'OCR 완료' : '미처리'}
          </span>
        </td>
        <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
          <button
            onClick={() => handleOCR(img)}
            disabled={ocrMutation.isPending}
            className={`px-3 py-1 rounded-md text-sm font-medium
              ${ocrMutation.isPending
                ? 'bg-gray-300 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-900'
              }`}
          >
            {ocrMutation.isPending ? "처리 중..." : "OCR 실행"}
          </button>
          <button
            onClick={() => handleFeatureExtraction(img)}
            disabled={isFeatureProcessed || isFeatureExtracting[img.id]}
            className={`px-3 py-1 rounded-md text-sm font-medium
              ${isFeatureProcessed || isFeatureExtracting[img.id]
                ? 'bg-gray-300 cursor-not-allowed'
                : 'text-purple-600 hover:text-purple-900'
              }`}
          >
            {isFeatureExtracting[img.id] ? "처리 중..." : isFeatureProcessed ? "완료" : "특징 추출"}
          </button>
          <button
            onClick={() => deleteMutation.mutate(img)}
            className="text-red-600 hover:text-red-900"
          >
            삭제
          </button>
        </td>
      </tr>
    );
  }, [signedUrls.data, parsedMetadata, handleOCR, images, queryClient, deleteMutation, ocrMutation.isPending, handleFeatureExtraction, isFeatureExtracting]);
  
  // 전체 로딩 상태를 통합적으로 관리
  const isPageLoading = signedUrls.isLoading || deleteMutation.isPending || ocrMutation.isPending || uploadMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <header className="pb-4 mb-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">이미지 관리 시스템</h1>
      </header>

      <div className="mb-8">
        <DragDropUpload 
          onFileSelect={setSelectedFiles}
          selectedFiles={selectedFiles}
          onUpload={handleUpload}
          isUploading={isUploading}
        />
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  미리보기
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  파일명
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  업로드일
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  OCR 상태
                </th><th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
      특징 추출 상태
    </th>
    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
      작업
    </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isPageLoading ? (
                Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
                  <ImageRowSkeleton key={index} />
                ))
              ) : (
                images.map((img) => (
                  <ImageRow key={img.id} img={img} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              다음
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                총 <span className="font-medium">{totalPages}</span> 페이지 중{' '}
                <span className="font-medium">{currentPage}</span> 페이지
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onOCR={handleOCR}
          onFeatureExtraction={handleFeatureExtraction}
          isOcrLoading={ocrMutation.isPending}
          isFeatureExtracting={isFeatureExtracting[selectedImage.id] || false}
          signedUrl={signedUrls.data?.[selectedImage.id]}
        />
      )}  
    </div>
  );
}
