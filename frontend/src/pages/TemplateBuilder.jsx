import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi';

const TemplateBuilder = () => {
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', url: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates/list');
      setTemplates(res.data || []);
    } catch (error) {
      toast.error('Gagal ambil templates');
    }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.url) {
      toast.error('Name dan URL required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/templates/scrape', newTemplate);
      toast.success('Template berhasil dibuat');
      setNewTemplate({ name: '', url: '' });
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal buat template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus template ini?')) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template dihapus');
      fetchTemplates();
    } catch (error) {
      toast.error('Gagal hapus template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <FiLink /> Template Builder
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Buat Template Baru</h2>
          <form onSubmit={handleAddTemplate} className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Nama Template"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 min-w-[150px]"
            />
            <input
              type="url"
              placeholder="URL (contoh: https://wikipedia.com)"
              value={newTemplate.url}
              onChange={(e) => setNewTemplate({ ...newTemplate, url: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1 min-w-[200px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <FiPlus size={18} />
              {loading ? '...' : 'Scrape'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Daftar Templates ({templates.length})</h2>
          </div>
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Belum ada template</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {templates.map((t) => (
                <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">{t.name}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{t.source_url}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;