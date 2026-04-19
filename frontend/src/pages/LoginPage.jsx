import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${config.API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      navigate('/dashboard');
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-mesh-gradient opacity-20 pointer-events-none" />

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">観察記録システム</h1>
          <p className="text-gray-500">ログインして記録を開始</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="example@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">
            アカウントをお持ちでない方
          </p>
          <Link
            to="/register"
            className="inline-block w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            新規アカウント登録
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
