import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUserPlus, FiTrash2, FiUser, FiCpu } from 'react-icons/fi';

const DashboardMaster = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchBalance();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Gagal ambil data users');
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get('/system/balance');
      setBalance(res.data);
    } catch (error) {
      // Silence error (not important)
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username dan password required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/users', newUser);
      toast.success('User berhasil ditambahkan');
      setNewUser({ username: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal tambah user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User dihapus');
      fetchUsers();
    } catch (error) {
      toast.error('Gagal hapus user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          👑 Master Dashboard
        </h1>

        {/* Balance */}
        {balance && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex gap-6">
            <div className="flex items-center gap-2">
              <FiCpu className="text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">OpenAI: <strong>${balance.openai?.credits || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FiCpu className="text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Fal.ai: <strong>{balance.fal?.credits || 0} credits</strong></span>
            </div>
          </div>
        )}

        {/* Add User */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUserPlus /> Tambah User Baru
          </h2>
          <form onSubmit={handleAddUser} className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 min-w-[150px]"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 min-w-[150px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              {loading ? '...' : 'Tambah'}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FiUser /> Daftar User ({users.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">{u.username}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {u.role}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {u.project_count || 0} projects
                  </span>
                </div>
                {u.role !== 'master' && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMaster;