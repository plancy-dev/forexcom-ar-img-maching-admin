import * as tf from '@tensorflow/tfjs';
import { ImageFeatures } from '../types';
import { supabase } from '../lib/supabase';

class ImageFeatureService {
  private static instance: ImageFeatureService;
  private model: tf.LayersModel | null = null;

  private constructor() {}

  public static getInstance(): ImageFeatureService {
    if (!ImageFeatureService.instance) {
      ImageFeatureService.instance = new ImageFeatureService();
    }
    return ImageFeatureService.instance;
  }

  private async loadModel(): Promise<void> {
    if (!this.model) {
      this.model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
    }
  }

  private async imageToTensor(imageUrl: string): Promise<tf.Tensor3D> {
    // Supabase signed URL 가져오기
    const { data } = await supabase.storage
      .from('images')
      .createSignedUrl(imageUrl.split('/').pop() || '', 60);

    if (!data?.signedUrl) {
      throw new Error('이미지 URL을 가져올 수 없습니다.');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = data.signedUrl;
    });

    const tensor = tf.browser.fromPixels(img);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const normalized = resized.div(255.0);
    
    tensor.dispose();
    resized.dispose();
    
    return normalized as tf.Tensor3D;
  }

  private calculateHistogram(tensor: tf.Tensor3D): number[] {
    const data = tensor.dataSync();
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i++) {
      const value = Math.floor(data[i] * 255);
      histogram[value]++;
    }
    
    // 정규화
    const max = Math.max(...histogram);
    return histogram.map(h => h / max);
  }

  public async extractFeatures(imageUrl: string): Promise<ImageFeatures> {
    await this.loadModel();
    const tensor = await this.imageToTensor(imageUrl);
    
    try {
      // MobileNet 특징 추출
      const features = this.model!.predict(tensor.expandDims(0)) as tf.Tensor;
      const mobileNetFeatures = Array.from(features.dataSync());
      
      // 통계적 특징 추출
      const mean = Array.from(tf.mean(tensor, [0, 1]).dataSync());
      const std = Array.from(tf.moments(tensor, [0, 1]).variance.sqrt().dataSync());
      const histogram = this.calculateHistogram(tensor);
      
      features.dispose();
      
      return {
        mobileNetFeatures,
        mean,
        std,
        histogram,
        extractedAt: new Date().toISOString()
      };
    } finally {
      tensor.dispose();
    }
  }

  public async cleanup(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

export const imageFeatureService = ImageFeatureService.getInstance();
