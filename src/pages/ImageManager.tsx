import  {  useState, useCallback, useMemo } from "react";

import ImageModal from "../components/ImageModal";
import { ImageRecord } from "../types";
import DragDropUpload from "../components/DragDropUpload";
import { toast } from 'react-toastify';
import { useImages } from '../hooks/useImages';
import { useImageMutations } from '../hooks/useImageMutations';
import { useOCR } from '../hooks/useOCR.ts';
import { useSignedUrls } from '../hooks/useSignedUrls';


const ITEMS_PER_PAGE = 10;

export default function ImageManager() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const { data: imagesData, isLoading } = useImages(currentPage, ITEMS_PER_PAGE);
  const { uploadMutation, deleteMutation } = useImageMutations();
  const images = imagesData?.images || [];
  const totalPages = imagesData?.totalPages || 1;

  // 이미지 메타데이터 파싱을 메모이제이션
  const parsedMetadata = useMemo(() => {
    return images.reduce((acc: Record<number, any>, img: ImageRecord) => {
      acc[img.id] = img.metadata ? JSON.parse(img.metadata) : {};
      return acc;
    }, {});
  }, [images]);

  const signedUrls = useSignedUrls(images);

  // OCR 성공 후 selectedImage 갱신을 위한 콜백
  const handleOCRSuccess = useCallback((updatedImage: ImageRecord) => {
    console.info(updatedImage)
    setSelectedImage(updatedImage);
  }, []);

  const ocrMutation = useOCR(parsedMetadata, handleOCRSuccess);

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
    } catch (error: any) {
      console.error("OCR 오류:", error);
      toast.error(error.message || "OCR 처리 중 오류가 발생했습니다.");
    }
  }, [signedUrls.data]);

  // 테이블 행 컴포넌트 분리
  const ImageRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-16 w-16 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-5 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-x-2">
          <div className="inline-block h-8 w-20 bg-gray-200 rounded"></div>
          <div className="inline-block h-8 w-12 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );
  const ImageRow = useCallback(({ img }: { img: ImageRecord }) => {
    const metadata = parsedMetadata[img.id];
    const isOCRProcessed = 'ocr' in metadata && 'ocrTimestamp' in metadata;
    
    
    const handleImageClick = () => {
      // 현재 images 배열에서 해당 이미지의 최신 데이터를 찾아서 설정
      const updatedImage = images.find(image => image.id === img.id);
      if (updatedImage) {
        setSelectedImage(updatedImage);
      }
    };
    
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div 
            className="h-16 w-16 cursor-pointer"
            onClick={handleImageClick}
          >
            {signedUrls.isLoading ? (
              <div className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
            ) : signedUrls.data?.[img.id] ? (
              <img
                src={signedUrls.data[img.id]}
                alt={metadata.originalName || '이미지'}
                className="h-16 w-16 object-cover rounded"
                loading="lazy"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
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
            isOCRProcessed
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isOCRProcessed ? 'OCR 완료' : '미처리'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
            onClick={() => deleteMutation.mutate(img)}
            className="text-red-600 hover:text-red-900"
          >
            삭제
          </button>
        </td>
      </tr>
    );
  }, [signedUrls.data, parsedMetadata, handleOCR, images]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <header className="mb-8 pb-4 border-b border-gray-200">
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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  미리보기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업로드일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OCR 상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {signedUrls.isLoading ? (
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
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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
          isOcrLoading={ocrMutation.isPending}
          signedUrl={signedUrls.data?.[selectedImage.id]}
        />
      )}  
    </div>
  );
}
