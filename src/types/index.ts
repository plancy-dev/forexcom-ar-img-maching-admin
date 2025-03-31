export interface ImageRecord {
  id: number;
  user_id: string;
  image_url: string;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
} 