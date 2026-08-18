import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiSun, FiMoon, FiUser, FiHome } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isMaster } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            🚀 Auto LP & AMP
          </Link>
          <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">
            <FiHome size={20} />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <FiUser size={14} />
            {user?.username}
            {isMaster && <span className="ml-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded">Master</span>}
          </span>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;