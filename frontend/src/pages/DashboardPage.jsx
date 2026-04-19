import React, { useEffect, useState } from 'react';
import { AlertCircle, LogOut, User, FileText, Plus, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI, subordinateAPI, observationAPI, dashboardAPI } from '../api/client';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subordinates, setSubordinates] = useState([]);
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState({ totalSubordinates: 0, thisWeekObservations: 0, totalObservations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'subordinates' | 'history'

  // 観察記録フォーム
  const [selectedSubordinateId, setSelectedSubordinateId] = useState('');
  const [observationDate, setObservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [behavior, setBehavior] = useState('');
  const [situation, setSituation] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  // 部下追加フォーム
  const [newSubName, setNewSubName] = useState('');
  const [newSubDept, setNewSubDept] = useState('');
  const [newSubPosition, setNewSubPosition] = useState('');
  const [addingSubordinate, setAddingSubordinate] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, subordinatesRes, observationsRes, statsRes] = await Promise.all([
        authAPI.me(),
        subordinateAPI.getAll(),
        observationAPI.getAll(),
        dashboardAPI.getStats(),
      ]);
      setUser(userRes.data);
      setSubordinates(subordinatesRes.data);
      setObservations(observationsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('❌ データ取得エラー:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('データの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSubmitObservation = async (e) => {
    e.preventDefault();
    if (!selectedSubordinateId || !behavior) {
      setError('部下と行動内容は必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await observationAPI.create({
        subordinate_id: selectedSubordinateId,
        observation_date: observationDate,
        behavior,
        situation,
        impact,
        category,
      });
      setSelectedSubordinateId('');
      setObservationDate(new Date().toISOString().split('T')[0]);
      setBehavior('');
      setSituation('');
      setImpact('');
      setCategory('');
      await fetchAllData();
      alert('✅ 観察記録を保存しました！');
    } catch (err) {
      console.error('❌ 保存エラー:', err);
      setError(err.response?.data?.error || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubordinate = async (e) => {
    e.preventDefault();
    if (!newSubName) return;
    setAddingSubordinate(true);
    try {
      await subordinateAPI.create({ name: newSubName, department: newSubDept, position: newSubPosition });
      setNewSubName('');
      setNewSubDept('');
      setNewSubPosition('');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.error || '部下の追加に失敗しました');
    } finally {
      setAddingSubordinate(false);
    }
  };

  const handleDeleteSubordinate = async (id, name) => {
    if (!window.confirm(`「${name}」を削除しますか？\n（関連する観察記録もすべて削除されます）`)) return;
    try {
      await subordinateAPI.delete(id);
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.error || '削除に失敗しました');
    }
  };

  const handleDeleteObservation = async (id) => {
    if (!window.confirm('この観察記録を削除しますか？')) return;
    try {
      await observationAPI.delete(id);
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.error || '削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">観察記録システム</h1>
            <p className="text-xs text-gray-500">{user?.company_name || ''} — {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        {/* 今週の記録アラート */}
        {stats.thisWeekObservations === 0 && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">今週の記録がまだありません</p>
              <p className="text-amber-700 text-xs mt-0.5">記憶が鮮明なうちに部下の行動を記録しましょう。</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">登録部下数</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalSubordinates}<span className="text-sm font-normal text-gray-500">名</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">今週の記録</p>
            <p className="text-2xl font-bold text-green-600">{stats.thisWeekObservations}<span className="text-sm font-normal text-gray-500">件</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">総記録数</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalObservations}<span className="text-sm font-normal text-gray-500">件</span></p>
          </div>
        </div>

        {/* タブナビ */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'record', label: '記録を追加', icon: <Plus size={15} /> },
            { key: 'subordinates', label: '部下管理', icon: <UserPlus size={15} /> },
            { key: 'history', label: '記録履歴', icon: <FileText size={15} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* === 記録追加タブ === */}
        {activeTab === 'record' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-500" />
              新しい観察記録
            </h2>
            {subordinates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <User size={40} className="mx-auto mb-2 opacity-30" />
                <p>まず「部下管理」タブで部下を登録してください</p>
                <button
                  onClick={() => setActiveTab('subordinates')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  部下を登録する
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitObservation} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部下を選択 <span className="text-red-500">*</span></label>
                  <select
                    value={selectedSubordinateId}
                    onChange={(e) => setSelectedSubordinateId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">選択してください</option>
                    {subordinates.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}{sub.department ? ` (${sub.department})` : ''}
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
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行動内容 <span className="text-red-500">*</span></label>
                  <textarea
                    value={behavior}
                    onChange={(e) => setBehavior(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="その時の状況や背景..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">影響・結果</label>
                  <textarea
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="その行動による影響や結果..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? '保存中...' : '記録を保存する'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* === 部下管理タブ === */}
        {activeTab === 'subordinates' && (
          <div className="space-y-4">
            {/* 部下追加フォーム */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-500" />
                部下を追加
              </h2>
              <form onSubmit={handleAddSubordinate} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">氏名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="山田 太郎"
                    className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">部署</label>
                  <input
                    type="text"
                    value={newSubDept}
                    onChange={(e) => setNewSubDept(e.target.value)}
                    placeholder="営業部"
                    className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-32"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">役職</label>
                  <input
                    type="text"
                    value={newSubPosition}
                    onChange={(e) => setNewSubPosition(e.target.value)}
                    placeholder="主任"
                    className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-28"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSubordinate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingSubordinate ? '追加中...' : '追加'}
                </button>
              </form>
            </div>

            {/* 部下一覧 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-3">登録済み部下（{subordinates.length}名）</h3>
              {subordinates.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">まだ登録されていません</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {subordinates.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {sub.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{sub.name}</p>
                          <p className="text-xs text-gray-500">
                            {[sub.department, sub.position].filter(Boolean).join(' / ') || '部署未設定'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubordinate(sub.id, sub.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === 記録履歴タブ === */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <FileText size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">観察記録履歴</h2>
              <span className="ml-auto text-xs text-gray-400">{observations.length}件</span>
            </div>
            {observations.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                <p>まだ記録がありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {observations.map(obs => (
                  <div key={obs.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{obs.subordinate_name}</span>
                          {obs.department && (
                            <span className="text-xs text-gray-500">{obs.department}</span>
                          )}
                          {obs.category && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{obs.category}</span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(obs.observation_date).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{obs.behavior}</p>
                        {obs.situation && <p className="text-xs text-gray-500">状況: {obs.situation}</p>}
                        {obs.impact && <p className="text-xs text-gray-500">影響: {obs.impact}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteObservation(obs.id)}
                        className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
