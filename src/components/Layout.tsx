import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F7F7] font-sans overflow-hidden print:h-auto print:overflow-visible" dir="rtl">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`
        fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        print:hidden
      `}>
        <Sidebar 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
        />
        
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-8 -left-3 w-6 h-6 bg-brand-main text-brand-third rounded-full items-center justify-center border-2 border-brand-third shadow-md hover:bg-brand-main/80 transition-colors z-50"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col relative">
        {/* Responsive Header */}
        <header className="bg-white shadow-sm px-4 py-3 border-b flex items-center justify-between lg:justify-end sticky top-0 z-30 print:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-xl lg:hidden text-brand-main"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
             {/* Future: Notifications, User Profile Quick Access */}
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">نظام إدارة نجار v1.0</p>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
