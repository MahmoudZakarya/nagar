import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Safe from './pages/Safe';
import Purchases from './pages/Purchases';
import ClientProfile from './pages/ClientProfile';
import LoginPage from './pages/LoginPage';
import Employees from './pages/Employees';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import QuotationEditor from './pages/QuotationEditor';
import QuotationPreview from './pages/QuotationPreview';
import UserManagement from './pages/UserManagement';
import BackupSettings from './pages/BackupSettings';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import logo from './assets/nagar-logo-removebg.png';



const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-main overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Animated Background Ring */}
        <div className="absolute inset-0 w-48 h-48 -m-10 border-4 border-white/10 rounded-full animate-ping"></div>
        
        {/* Animated Logo Container */}
        <div className="relative animate-in zoom-in spin-in-12 duration-1000 ease-out">
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <img 
            src={logo}
            alt="Nagar Logo" 
            className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl animate-bounce"
          />
        </div>

        {/* Loading Text */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="h-1 w-40 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-brand-secondary w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
          </div>
          <p className="text-white/60 font-black text-xs tracking-[0.5em] uppercase animate-pulse">
            جاري التحميل
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientProfile />} />
          <Route path="quotations/new" element={<QuotationEditor />} />
          <Route path="quotations/:id/edit" element={<QuotationEditor />} />
          <Route path="quotations/:id/preview" element={<QuotationPreview />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="safe" element={<Safe />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeProfilePage />} />
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Route path="users" element={<UserManagement />} />
          )}
          {user?.role === 'admin' && (
            <Route path="backup" element={<BackupSettings />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}

export default App;
