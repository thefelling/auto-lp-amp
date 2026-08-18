import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiEye, FiCopy, FiDownload, FiTrash2, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

const History = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { isMaster } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const typeLabel = type === 'amp' ? 'AMP' : 'Landing Page';

  useEffect(() => {
    fetchProjects();
  }, [type, page, search]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/history/${type}`, {
        params: { page, limit: 10, search }
      });
      setProjects(res.data.data || []);
    } catch (error) {
      toast.error('Gagal ambil history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus project ini?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project dihapus');
      fetchProjects();
    } catch (error) {
      toast.error('Gagal hapus');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Hapus semua ${typeLabel}?`)) return;
    try {
      await api.delete(`/projects/history/all/${type}`);
      toast.success('Semua history dihapus');
      fetchProjects();
    } catch (error) {
      toast.error('Gagal hapus semua');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiClock /> History {typeLabel}
          </h1>
          {projects.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <FiTrash2 size={16} />
              Hapus Semua
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Belum ada project {typeLabel}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((project) => (
                <div key={project.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {project.site_name || project.source_domain}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        project.status === 'ready' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(project.created_at).toLocaleString('id-ID')}
                    </div>
                    {project.config?.title && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate max-w-md">
                        {project.config.title}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/preview/${project.id}`)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Preview"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(project.html_content || '');
                        toast.success('HTML copied!');
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Copy HTML"
                    >
                      <FiCopy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Hapus"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;