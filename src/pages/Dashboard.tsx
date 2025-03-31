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
    } catch (error: any) {
      setServerStatus({
        loading: false,
        error: "Supabase 서버 연결 실패",
        isConnected: false,
        lastChecked: new Date().toISOString()
      });
    }
  }

  useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">대시보드</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">시스템 상태</h3>
        {serverStatus.loading ? (
          <p className="text-gray-600">상태 확인 중...</p>
        ) : serverStatus.error ? (
          <div className="flex items-center text-red-600">
            <span>❌ {serverStatus.error}</span>
            <button
              onClick={checkServerStatus}
              className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              재시도
            </button>
          </div>
        ) : (
          <div>
            <p className={serverStatus.isConnected ? 'text-green-600' : 'text-red-600'}>
              {serverStatus.isConnected ? '✅ 정상 작동 중' : '❌ 연결 오류'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              마지막 확인: {new Date(serverStatus.lastChecked).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 