// src/types/image.ts
export interface ImageRecord {
    id: number;
    user_id: string;
    image_url: string;
    metadata: string | null;
    created_at: string;
    updated_at: string;
    features?: string; // 텐서 특징 벡터 (JSON 문자열로 저장)
    similarity?: number; // 유사도 점수
  }
  
  export interface ImageFeatures {
    mobileNetFeatures: number[];
    mean: number[];
    std: number[];
    histogram: number[];
    extractedAt: string;
  }