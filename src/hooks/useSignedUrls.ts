import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ImageRecord } from '../types';

export const useSignedUrls = (images: ImageRecord[]) => {
  return useQuery({
    queryKey: ['signedUrls', images.map(img => img.id)],
    queryFn: async () => {
      const urls: Record<number, string> = {};
      for (const image of images) {
        const fileName = image.image_url.split('/').pop();
        if (fileName) {
          const { data } = await supabase.storage
            .from('images')
            .createSignedUrl(fileName, 3600);
          urls[image.id] = data?.signedUrl || image.image_url;
        }
      }
      return urls;
    },
    enabled: images.length > 0,
    staleTime: 3600 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
};
