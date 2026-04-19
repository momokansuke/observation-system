import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で設定してください');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${config.API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name
      });

      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      navigate('/dashboard');
    } catch (err) {
      console.error('登録エラー:', err);
      setError(err.response?.data?.error || '登録に失敗しました');
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
          <p className="text-gray-500">新規アカウント登録</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              氏名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="山田 太郎"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              会社名・組織名
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="株式会社○○"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="example@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              パスワード <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="6文字以上"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
                placeholder="もう一度入力"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={16} />
            既にアカウントをお持ちの方はログイン
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
