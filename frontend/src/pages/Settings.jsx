import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { FiMoon, FiSun, FiLogOut } from 'react-icons/fi';

const Settings = () => {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Settings</h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg divide-y divide-gray-200 dark:divide-gray-700">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ganti tema gelap/terang</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">Logout</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keluar dari akun</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
            >
              <FiLogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;