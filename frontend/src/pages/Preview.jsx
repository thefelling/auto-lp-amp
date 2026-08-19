import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCopy, FiDownload, FiSmartphone, FiMonitor } from 'react-icons/fi';

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      toast.error('Project tidak ditemukan');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!project) return null;

  const deviceClasses = {
    mobile: 'max-w-[375px]',
    tablet: 'max-w-[768px]',
    desktop: 'max-w-full'
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Preview: {project.site_name || project.source_domain}
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg w-fit">
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-lg transition ${device === 'mobile' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiSmartphone size={18} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded-lg transition ${device === 'tablet' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiMonitor size={18} />
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-lg transition ${device === 'desktop' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiMonitor size={18} />
          </button>
        </div>

        <div className={`mx-auto ${deviceClasses[device]} bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all`}>
          <iframe
            srcDoc={project.html_content || ''}
            className="w-full h-[600px] border-0"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title="Preview"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(project.html_content || '');
              toast.success('HTML copied!');
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <FiCopy /> Copy HTML
          </button>
          <button
            onClick={() => {
              const blob = new Blob([project.html_content || ''], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${project.site_name || 'project'}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <FiDownload /> Download HTML
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preview;