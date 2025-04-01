import { supabase } from '../../lib/supabase';
import { imageFeatureService } from '../../services/imageFeatureService';

export async function extractImageFeatures(imageId: number) {
  try {
    // 이미지 데이터 조회
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw new Error('이미지를 찾을 수 없습니다.');
    }

    // 이미지 특징 추출
    const features = await imageFeatureService.extractFeatures(image.image_url);

    // 메타데이터 업데이트
    const metadata = image.metadata ? JSON.parse(image.metadata) : {};
    const updatedMetadata = {
      ...metadata,
      features,
      featureTimestamp: new Date().toISOString()
    };

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('images')
      .update({ metadata: JSON.stringify(updatedMetadata) })
      .eq('id', imageId);

    if (updateError) {
      throw new Error('메타데이터 업데이트 실패');
    }

    return { success: true };
  } catch (error) {
    console.error('특징 추출 오류:', error);
    throw error;
  }
} 