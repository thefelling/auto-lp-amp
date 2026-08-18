import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardMaster from './pages/DashboardMaster';
import AmpGenerator from './pages/AmpGenerator';
import LpGenerator from './pages/LpGenerator';
import TemplateBuilder from './pages/TemplateBuilder';
import History from './pages/History';
import Preview from './pages/Preview';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/master" element={<DashboardMaster />} />
            <Route path="/amp" element={<AmpGenerator />} />
            <Route path="/lp" element={<LpGenerator />} />
            <Route path="/templates" element={<TemplateBuilder />} />
            <Route path="/history/:type" element={<History />} />
            <Route path="/preview/:id" element={<Preview />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;