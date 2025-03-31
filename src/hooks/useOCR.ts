// src/hooks/useOCR.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ImageRecord } from '../types';
import { toast } from 'react-toastify';

interface OCRParams {
  image: ImageRecord;
  base64Content: string;
}

export const useOCR = (
  parsedMetadata: Record<number, any>,
  onSuccess?: (image: ImageRecord) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image, base64Content }: OCRParams) => {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.VITE_GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Content },
              features: [{ type: 'TEXT_DETECTION' }],
              imageContext: { languageHints: ['ko', 'en'] }
            }]
          }),
        }
      );

      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        throw new Error(`OCR 처리 실패: ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      const data = await visionResponse.json();
      const ocrResult = data.responses[0];
      const ocrText = ocrResult.fullTextAnnotation?.text || '';

      const currentMetadata = parsedMetadata[image.id];
      const newMetadata = {
        ...currentMetadata,
        ocr: ocrText,
        ocrTimestamp: new Date().toISOString(),
        ocrDetails: {
          confidence: ocrResult.fullTextAnnotation?.pages?.[0]?.confidence || 0,
          languageCode: ocrResult.textAnnotations?.[0]?.locale || 'unknown'
        }
      };

      // 업데이트된 이미지 정보를 반환받음
      const { data: updatedImage, error } = await supabase
        .from('images')
        .update({ metadata: JSON.stringify(newMetadata) })
        .eq('id', image.id)
        .select()
        .single();

      if (error) throw error;
      return updatedImage;
    },
    onSuccess: (updatedImage) => {

      console.info(updatedImage)
      // 이미지 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['images'] });
      // 성공 콜백 실행
      onSuccess?.(updatedImage);
      toast.success("OCR 처리가 완료되었습니다.");
    },
    onError: (error: any) => {
      console.error("OCR 오류:", error);
      toast.error(error.message || "OCR 처리 중 오류가 발생했습니다.");
    }
  });
};