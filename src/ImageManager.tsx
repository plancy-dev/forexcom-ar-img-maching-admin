import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 타입 정의 수정
type Image = {
  name: string;
  id: string;
  created_at: string;
  // size 제거 또는 옵셔널로 변경
};

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, onClose }) => {
  // React.MouseEvent 타입 명시
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        cursor: 'zoom-out'
      }}
      onClick={handleBackdropClick}
    >
      <img
        src={imageUrl}
        alt={alt}
        style={{
          maxWidth: '90%',
          maxHeight: '90vh',
          objectFit: 'contain',
          cursor: 'zoom-out'
        }}
      />
    </div>
  );
};

export default function ImageManager() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<{[key: string]: string}>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchImages();
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchImages();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchImages();
  }, [session]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({
            email,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) throw error;
      
      // 성공 시 입력 필드 초기화
      setEmail("");
      setPassword("");
      
    } catch (error: any) {
      setError(error.message);
      console.error("인증 중 에러 발생:", error);
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setImages([]); // 로그아웃 시 이미지 목록 초기화
    } catch (error) {
      console.error("로그아웃 중 에러 발생:", error);
    }
  }

  async function fetchImages() {
    try {
      const { data: listData, error: listError } = await supabase.storage
        .from("images")
        .list();
      
      if (listError) {
        console.error("이미지 목록 조회 중 에러:", listError);
        return;
      }
      
      if (listData) {
        setImages(listData as Image[]); // 타입 캐스팅 추가
        
        const urls: {[key: string]: string} = {};
        for (const img of listData) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("images")
            .createSignedUrl(img.name, 3600);

          if (signedError) {
            console.error(`${img.name} 서명 URL 생성 중 에러:`, signedError);
            continue;
          }

          if (signedData) {
            urls[img.name] = signedData.signedUrl;
          }
        }
        setImageUrls(urls);
      }
    } catch (err) {
      console.error("예상치 못한 에러:", err);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    
    try {
      const { data, error } = await supabase.storage
        .from("images")
        .upload(selectedFile.name, selectedFile);
        
      if (error) throw error;
      if (data) {
        // 업로드 후 이미지 목록 새로고침
        fetchImages();
      }
    } catch (err) {
      console.error("업로드 중 에러 발생:", err);
    }
  }

  async function handleDelete(imageName: string) {
    try {
      const { error } = await supabase.storage
        .from("images")
        .remove([imageName]);
        
      if (error) throw error;
      
      // 삭제 후 이미지 목록과 URL 상태 업데이트
      setImages(prev => prev.filter(img => img.name !== imageName));
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[imageName];
        return newUrls;
      });
    } catch (err) {
      console.error("삭제 중 에러 발생:", err);
    }
  }

  if (loading) {
    return <div>로딩중...</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>📸 이미지 관리자</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit">
            {isSignUp ? '회원가입' : '로그인'}
          </button>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📸 이미지 관리자</h2>
      <div style={{ marginBottom: "20px" }}>
        <span>환영합니다, {session.user.email}!</span>
        <button onClick={signOut} style={{ marginLeft: "10px" }}>
          로그아웃
        </button>
      </div>

      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
      />
      <button onClick={handleUpload}>업로드</button>

      <h3>🖼 저장된 이미지</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {images.map((img) => (
          <div 
            key={img.name}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div 
              style={{
                width: '100%',
                aspectRatio: '1',
                overflow: 'hidden',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                position: 'relative',
                cursor: 'zoom-in'
              }}
              onClick={() => setSelectedImage(imageUrls[img.name])}
            >
              {imageUrls[img.name] && (
                <img 
                  src={imageUrls[img.name]}
                  alt={img.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                  onError={(e) => {
                    console.error(`이미지 로드 실패: ${img.name}`);
                    e.currentTarget.src = 'https://via.placeholder.com/200?text=Error';
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              )}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <a 
                href={imageUrls[img.name]}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '70%'
                }}
              >
                {img.name}
              </a>
              <button 
                onClick={() => handleDelete(img.name)}
                style={{
                  padding: '4px 8px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          alt="확대된 이미지"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
