import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiUserPlus, 
  FiTrash2, 
  FiUser, 
  FiCpu, 
  FiEye, 
  FiEyeOff, 
  FiEdit2,
  FiX,
  FiCheck
} from 'react-icons/fi';
import Modal from '../components/Modal';

const DashboardMaster = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);

  // State untuk modal edit password
  const [editModal, setEditModal] = useState({ isOpen: false, userId: null, username: '', newPassword: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBalance();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Gagal ambil data users');
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get('/api/system/balance');
      setBalance(res.data);
    } catch (error) {
      // Silence error
    }
  };

  // ===== TAMBAH USER =====
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username dan password required');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/admin/users', newUser);
      toast.success('User berhasil ditambahkan');
      setNewUser({ username: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal tambah user');
    } finally {
      setLoading(false);
    }
  };

  // ===== HAPUS USER =====
  const handleDeleteUser = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success('User dihapus');
      fetchUsers();
    } catch (error) {
      toast.error('Gagal hapus user');
    }
  };

  // ===== EDIT PASSWORD =====
  const openEditModal = (userId, username) => {
    setEditModal({
      isOpen: true,
      userId: userId,
      username: username,
      newPassword: ''
    });
    setShowEditPassword(false);
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      userId: null,
      username: '',
      newPassword: ''
    });
    setShowEditPassword(false);
    setEditLoading(false);
  };

  const handleEditPassword = async (e) => {
    e.preventDefault();
    if (!editModal.newPassword || editModal.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setEditLoading(true);
    try {
      // Panggil API update password (nanti kita tambahin di backend)
      await api.put(`/api/admin/users/${editModal.userId}/password`, {
        password: editModal.newPassword
      });
      toast.success(`Password untuk ${editModal.username} berhasil diupdate`);
      closeEditModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal update password');
    } finally {
      setEditLoading(false);
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

        {/* ===== FORM TAMBAH USER ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUserPlus /> Tambah User Baru
          </h2>
          <form onSubmit={handleAddUser} className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="flex-1 min-w-[150px] relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 karakter)"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              {loading ? '...' : <><FiUserPlus size={16} /> Tambah</>}
            </button>
          </form>
        </div>

        {/* ===== DAFTAR USER ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FiUser /> Daftar User ({users.length})
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Belum ada user
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">{u.username}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {u.role}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {u.project_count || 0} projects
                    </span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                      {u.last_login ? `Last login: ${new Date(u.last_login).toLocaleDateString('id-ID')}` : 'Belum login'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tombol Edit Password */}
                    {u.role !== 'master' && (
                      <button
                        onClick={() => openEditModal(u.id, u.username)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Reset Password"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    )}

                    {/* Tombol Hapus */}
                    {u.role !== 'master' && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Hapus User"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL EDIT PASSWORD ===== */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        title={`Reset Password - ${editModal.username}`}
        size="sm"
      >
        <form onSubmit={handleEditPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showEditPassword ? 'text' : 'password'}
                placeholder="Password baru (min 6 karakter)"
                value={editModal.newPassword}
                onChange={(e) => setEditModal({ ...editModal, newPassword: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showEditPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <FiX size={16} /> Batal
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            >
              {editLoading ? '...' : <><FiCheck size={16} /> Simpan</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardMaster;