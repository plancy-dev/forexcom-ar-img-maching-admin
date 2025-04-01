import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ServerStatus = {
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastChecked: string;
};

export default function Dashboard() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    loading: true,
    error: null,
    isConnected: false,
    lastChecked: new Date().toISOString()
  });

  async function checkServerStatus() {
    setServerStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase
        .from('images')
        .select('id')
        .limit(1);
      
      setServerStatus({
        loading: false,
        error: null,
        isConnected: !error,
        lastChecked: new Date().toISOString()
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setServerStatus({
          loading: false,
          error: error.message,
          isConnected: false,
          lastChecked: new Date().toISOString()
        });
      } else {
        setServerStatus({
          loading: false,
          error: "Supabase 서버 연결 실패",
          isConnected: false,
          lastChecked: new Date().toISOString()
        });
      }
    }
  }

  useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">대시보드</h1>
      
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">시스템 상태</h3>
        {serverStatus.loading ? (
          <p className="text-gray-600">상태 확인 중...</p>
        ) : serverStatus.error ? (
          <div className="flex items-center text-red-600">
            <span>❌ {serverStatus.error}</span>
            <button
              onClick={checkServerStatus}
              className="px-3 py-1 ml-4 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              재시도
            </button>
          </div>
        ) : (
          <div>
            <p className={serverStatus.isConnected ? 'text-green-600' : 'text-red-600'}>
              {serverStatus.isConnected ? '✅ 정상 작동 중' : '❌ 연결 오류'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              마지막 확인: {new Date(serverStatus.lastChecked).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 