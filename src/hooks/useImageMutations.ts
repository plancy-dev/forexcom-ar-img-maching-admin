// src/hooks/useImageMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ImageRecord } from '../types';
import { toast } from 'react-toastify';

export const useImageMutations = () => {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = [];
      for (const file of files) {
        const fileUuid = crypto.randomUUID();
        const fileExt = file.name.split('.').pop();
        const fileName = `${fileUuid}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("images")
          .getPublicUrl(fileName);

        const { data, error } = await supabase.from('images').insert({
          image_url: publicUrl,
          metadata: JSON.stringify({
            originalName: file.name,
            size: file.size,
            type: file.type
          })
        });

        if (error) throw error;
        results.push(data);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast.success("이미지가 성공적으로 업로드되었습니다!");
    },
    onError: (error) => {
      console.error("업로드 오류:", error);
      toast.error("파일 업로드 중 오류가 발생했습니다.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (image: ImageRecord) => {
      const fileName = image.image_url.split('/').pop();
      if (fileName) {
        await Promise.all([
          supabase.storage.from("images").remove([fileName]),
          supabase.from('images').delete().eq('id', image.id)
        ]);
      }
      return image;
    },
    onMutate: async (deletedImage) => {
      const previousImages = queryClient.getQueryData(['images']);
      
      queryClient.setQueryData(['images'], (old: { images: ImageRecord[] }) => ({
        ...old,
        images: old?.images?.filter((img: ImageRecord) => img.id !== deletedImage.id) || []
      }));

      return { previousImages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast.success("이미지가 삭제되었습니다.");
    },
    onError: (error, _, context) => {
      if (context?.previousImages) {
        queryClient.setQueryData(['images'], context.previousImages);
      }
      console.error("삭제 오류:", error);
      toast.error("파일 삭제 중 오류가 발생했습니다.");
    }
  });

  return { uploadMutation, deleteMutation };
};