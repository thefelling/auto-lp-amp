import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiFileText, 
  FiLayout, 
  FiHistory, 
  FiPlus, 
  FiSettings, 
  FiUsers,
  FiLogOut 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isMaster, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/amp', label: 'Generate AMP', icon: FiFileText },
    { path: '/lp', label: 'Generate LP', icon: FiLayout },
    { path: '/history/amp', label: 'History', icon: FiHistory },
    { path: '/templates', label: 'Templates', icon: FiPlus },
  ];

  if (isMaster) {
    menuItems.push({ path: '/dashboard/master', label: 'Master Dashboard', icon: FiUsers });
  }

  menuItems.push({ path: '/settings', label: 'Settings', icon: FiSettings });

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:relative lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="text-lg font-bold text-gray-800 dark:text-white">
                Auto LP & AMP
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {user?.username} {isMaster && <span className="text-red-500">(Master)</span>}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg transition
                    ${active 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <FiLogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;