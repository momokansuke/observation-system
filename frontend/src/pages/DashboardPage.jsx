import React, { useEffect, useState } from 'react';
import { AlertCircle, LogOut, User, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subordinates, setSubordinates] = useState([]);
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState({ totalSubordinates: 0, thisWeekObservations: 0, totalObservations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // フォーム状態
  const [selectedSubordinateId, setSelectedSubordinateId] = useState('');
  const [observationDate, setObservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [behavior, setBehavior] = useState('');
  const [situation, setSituation] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Axiosのデフォルトヘッダーを設定
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const [userRes, subordinatesRes, observationsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/me'),
        axios.get('http://localhost:5000/api/subordinates'),
        axios.get('http://localhost:5000/api/observations'),
        axios.get('http://localhost:5000/api/dashboard/stats'),
      ]);

      setUser(userRes.data);
      setSubordinates(subordinatesRes.data);
      setObservations(observationsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('❌ データ取得エラー:', err);
      setError('データの取得に失敗しました');
      
      // 認証エラーの場合はログイン画面に戻る
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleSubmitObservation = async (e) => {
    e.preventDefault();
    
    if (!selectedSubordinateId || !behavior) {
      setError('部下と行動内容は必須です');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/observations', {
        subordinate_id: selectedSubordinateId,
        observation_date: observationDate,
        behavior,
        situation,
        impact,
        category
      });

      // フォームリセット
      setSelectedSubordinateId('');
      setObservationDate(new Date().toISOString().split('T')[0]);
      setBehavior('');
      setSituation('');
      setImpact('');
      setCategory('');
      setError('');

      // データ再取得
      fetchAllData();
      alert('観察記録を保存しました！');
    } catch (err) {
      console.error('❌ 保存エラー:', err);
      setError('保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">観察記録ダッシュボード</h1>
            <p className="text-sm text-gray-500">管理者: {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 今週の記録状況アラート */}
        <div
          className="alert alert-warning mb-6"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #ef4444',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <AlertCircle size={32} color="#dc2626" />
          <div>
            <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.125rem', fontWeight: 'bold' }}>
              今週の記録をお忘れなく！
            </h3>
            <p style={{ margin: '0.5rem 0 0', color: '#7f1d1d', fontSize: '0.875rem' }}>
              記憶が鮮明なうちに部下の行動を記録することで、より正確で有用な評価につながります。
              週に1回は必ず記録するようお願いします。（今週の記録数: {stats.thisWeekObservations}件）
            </p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <User className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">登録部下数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubordinates}名</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">今週の記録</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekObservations}件</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">総記録数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalObservations}件</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：観察記録入力フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} />
              新しい観察記録
            </h2>
            <form onSubmit={handleSubmitObservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部下を選択 *</label>
                <select
                  value={selectedSubordinateId}
                  onChange={(e) => setSelectedSubordinateId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">選択してください</option>
                  {subordinates.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.department || '部署未設定'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">観察日</label>
                <input
                  type="date"
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行動内容 *</label>
                <textarea
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="具体的な行動を記録してください..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状況・背景</label>
                <textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="その時の状況や背景..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">影響・結果</label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="その行動による影響や結果..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  <option value="コミュニケーション">コミュニケーション</option>
                  <option value="リーダーシップ">リーダーシップ</option>
                  <option value="問題解決">問題解決</option>
                  <option value="チームワーク">チームワーク</option>
                  <option value="専門スキル">専門スキル</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                記録を保存
              </button>
            </form>
          </div>

          {/* 右側：最近の観察記録 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              最近の観察記録
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {observations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">まだ観察記録がありません</p>
              ) : (
                observations.slice(0, 10).map(obs => (
                  <div key={obs.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">{obs.subordinate_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(obs.observation_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{obs.behavior}</p>
                    {obs.category && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {obs.category}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
