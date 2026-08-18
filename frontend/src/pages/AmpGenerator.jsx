import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiLoader, FiCheckCircle } from 'react-icons/fi';

const AmpGenerator = () => {
  const [formData, setFormData] = useState({
    sourceDomain: '',
    siteName: '',
    canonical: '',
    targetLink: ''
  });
  const [titleFile, setTitleFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setTitleFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titleFile) {
      toast.error('Upload file titles.txt terlebih dahulu');
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append('sourceDomain', formData.sourceDomain);
    form.append('siteName', formData.siteName);
    form.append('canonical', formData.canonical || formData.sourceDomain);
    form.append('targetLink', formData.targetLink || formData.sourceDomain);
    form.append('titleFile', titleFile);

    try {
      const res = await api.post('/projects/amp/generate', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      toast.success('AMP berhasil dibuat!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal generate AMP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          📱 Generate AMP
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domain Contoh *
              </label>
              <input
                type="url"
                name="sourceDomain"
                value={formData.sourceDomain}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://go.maxwinolx1.com/"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Situs *
              </label>
              <input
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="omutogel"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Canonical URL
              </label>
              <input
                type="url"
                name="canonical"
                value={formData.canonical}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://omutogel.com/"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Link (Link Arah)
              </label>
              <input
                type="url"
                name="targetLink"
                value={formData.targetLink}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://omutogel.com/login"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Titles.txt *
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <FiUpload size={18} />
                  Generate AMP
                </>
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <FiCheckCircle size={20} />
              <span className="font-semibold">AMP Berhasil Dibuat!</span>
            </div>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>Project ID:</strong> {result.projectId}</p>
              <p><strong>Title:</strong> {result.title}</p>
              <p><strong>Description:</strong> {result.description}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/preview/${result.projectId}`)}
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.html);
                    toast.success('HTML copied!');
                  }}
                  className="px-4 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  Copy HTML
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmpGenerator;