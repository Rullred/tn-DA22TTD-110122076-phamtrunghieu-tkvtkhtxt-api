import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function QrConfirm() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác nhận đăng nhập...');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Mã QR không hợp lệ');
      return;
    }

    // Call backend to confirm QR login
    const confirmLogin = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        console.log('Calling QR confirm API:', `${apiBaseUrl}/api/auth/qr-confirm?token=${token}`);
        
        const response = await fetch(`${apiBaseUrl}/api/auth/qr-confirm?token=${token}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'text/html,application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          setStatus('success');
          setMessage('Đăng nhập thành công!');
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          setStatus('error');
          setMessage(`Mã QR đã hết hạn hoặc không hợp lệ (${response.status})`);
        }
      } catch (err: any) {
        console.error('QR confirm error:', err);
        const debugDetails = `
Error: ${err.message}
Stack: ${err.stack || 'N/A'}
API URL: ${import.meta.env.VITE_API_BASE_URL}
Token: ${token?.substring(0, 10)}...
        `.trim();
        setDebugInfo(debugDetails);
        setStatus('error');
        setMessage(`Không thể kết nối: ${err.message}`);
      }
    };

    confirmLogin();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 font-sans">
      {/* Glow ambient background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 text-center space-y-6">
            
            {status === 'loading' && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Đang xác nhận...
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Vui lòng chờ trong giây lát
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Đăng nhập thành công!
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <p className="text-xs text-blue-800 dark:text-blue-350 font-semibold">
                    Vui lòng quay lại trình duyệt trên máy tính để tiếp tục.
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Xác nhận thất bại
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                  <p className="text-xs text-amber-800 dark:text-amber-350 font-semibold">
                    Vui lòng thử lại trên máy tính.
                  </p>
                  {debugInfo && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-slate-600">Chi tiết lỗi</summary>
                      <pre className="text-xs text-left mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-auto">
                        {debugInfo}
                      </pre>
                    </details>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
