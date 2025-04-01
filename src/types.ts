export interface ImageRecord {
  id: number;
  user_id: string;
  image_url: string;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageFeatures {
  mobileNetFeatures: number[];
  mean: number[];
  std: number[];
  histogram: number[];
  extractedAt: string;
}

export interface ImageMetadata {
  originalName?: string;
  size?: number;
  type?: string;
  ocr?: string;
  ocrTimestamp?: string;
  ocrDetails?: {
    confidence: number;
    languageCode: string;
  };
  features?: ImageFeatures;
  featureTimestamp?: string;
} 