import { useState } from 'react';
import { Link } from 'react-router';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Quên mật khẩu?</h1>
          <p className="text-gray-600">Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gửi link đặt lại
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-gray-900 mb-2">Kiểm tra email của bạn</h3>
              <p className="text-sm text-gray-600 mb-6">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          )}

          {!submitted && (
            <div className="mt-6">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
