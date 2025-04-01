// src/hooks/useFeatureExtraction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ImageRecord, } from '../types';
import { toast } from 'react-toastify';
import { extractImageFeatures } from '../api/images/extract-features';

interface FeatureExtractionParams {
  image: ImageRecord;
}

export const useFeatureExtraction = (
  onSuccess?: (image: ImageRecord) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image }: FeatureExtractionParams) => {
      await extractImageFeatures(image.id);

      // 업데이트된 이미지 정보를 반환받음
      const { data: updatedImage, error } = await supabase
        .from('images')
        .select()
        .eq('id', image.id)
        .single();

      if (error) throw error;
      return updatedImage;
    },
    onSuccess: (updatedImage) => {
      // 이미지 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['images'] });
      // 성공 콜백 실행
      onSuccess?.(updatedImage);
      toast.success("특징 분석이 완료되었습니다.");
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error("특징 분석 오류:", error);
        toast.error(error.message || "특징 분석 중 오류가 발생했습니다.");
      } else {
        console.error("특징 분석 오류:", error);
        toast.error("특징 분석 중 오류가 발생했습니다.");
      }
    }
  });
};