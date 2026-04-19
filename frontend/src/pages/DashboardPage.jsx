import React, { useEffect, useState } from 'react';
import { LogOut, Plus, Calendar, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [userRes, logsRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/auth/me`),
        axios.get(`${config.API_URL}/api/logs`)
      ]);
      setUser(userRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content) return;
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/api/logs`, { date, content });
      setContent('');
      fetchData(); // Refresh logs
      alert('記録しました');
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">Obs</span>
            観察記録
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 border px-2 py-1 rounded bg-gray-50">{user?.role === 'admin' ? '管理者' : user?.name}</span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {user?.role === 'admin' ? (
          // ADMIN VIEW
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">全ユーザーの記録一覧</h2>
            <div className="grid gap-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {log.user_name?.[0]}
                      </div>
                      <span className="font-bold text-gray-800">{log.user_name}</span>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      {log.date}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap pl-10">{log.content}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-500 text-center py-8">記録はまだありません</p>}
            </div>
          </div>
        ) : (
          // USER VIEW
          <div className="grid md:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-blue-600" />
                  新規記録
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg h-40 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="今日の出来事や観察内容..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '記録する'}
                  </button>
                </form>
              </div>
            </div>

            {/* My Logs */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-gray-600" />
                自分の記録
              </h2>
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-blue-600/80 text-sm border border-blue-100 bg-blue-50 px-2 py-0.5 rounded">
                      {log.date}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {log.content}
                  </p>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-400">まだ記録がありません</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
