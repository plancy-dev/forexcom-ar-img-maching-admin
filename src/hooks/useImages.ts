// src/hooks/useImages.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ImageRecord } from '../types';

interface ImageQueryResult {
  images: ImageRecord[];
  totalPages: number;
}

export const useImages = (currentPage: number, itemsPerPage: number) => {
  return useQuery<ImageQueryResult>({
    queryKey: ['images', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from('images')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        images: data as ImageRecord[],
        totalPages: Math.ceil((count || 0) / itemsPerPage)
      };
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 갱신 비활성화
    refetchOnMount: false, // 컴포넌트 마운트 시 자동 갱신 비활성화
  });
};