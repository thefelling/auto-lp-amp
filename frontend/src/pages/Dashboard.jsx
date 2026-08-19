import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { FiFileText, FiLayout, FiClock, FiSettings, FiPlus } from 'react-icons/fi';

const Dashboard = () => {
  const { user, isMaster } = useAuth();
  const { darkMode } = useTheme();

  const cards = [
    { title: 'Generate AMP', desc: 'Buat landing page AMP dari domain lain', icon: FiFileText, path: '/amp', color: 'bg-blue-500' },
    { title: 'Generate LP', desc: 'Buat landing page dengan mini game', icon: FiLayout, path: '/lp', color: 'bg-purple-500' },
    { title: 'History', desc: 'Lihat semua proyek yang pernah dibuat', icon: FiClock, path: '/history/amp', color: 'bg-green-500' },
    { title: 'Templates', desc: 'Kelola template landing page', icon: FiPlus, path: '/templates', color: 'bg-orange-500' },
  ];

  if (isMaster) {
    cards.push({ title: 'Master Dashboard', desc: 'Kelola user & sistem', icon: FiSettings, path: '/dashboard/master', color: 'bg-red-500' });
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Selamat datang, {user?.username || 'User'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Pilih menu di bawah untuk memulai
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className={`${card.color} hover:opacity-90 rounded-xl p-6 text-white shadow-lg transition transform hover:-translate-y-1`}
              >
                <Icon size={32} className="mb-3" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm opacity-90 mt-1">{card.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;