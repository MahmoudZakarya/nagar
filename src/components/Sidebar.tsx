import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Hammer, Landmark , ShoppingCart, LogOut, Search, X, BriefcaseBusiness, Contact, Sun, Moon, KeyRound, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import logo from '../assets/nagar-logo-removebg.png';
import { toast } from 'react-hot-toast';
import API_URL from '../config/api';


const Sidebar = ({ onClose, isCollapsed }: { onClose?: () => void, isCollapsed?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/clients?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (passwordData.newPassword.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'العملاء', path: '/clients', icon: Contact },
    { name: 'المشاريع', path: '/tasks', icon: Hammer },
    { name: 'الخزنة', path: '/safe', icon: Landmark  },
    { name: 'المشتريات', path: '/purchases', icon: ShoppingCart },
    { name: 'الموظفين', path: '/employees', icon: BriefcaseBusiness},
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navItems.push({ name: 'إدارة المستخدمين', path: '/users', icon: Users });
  }

  if (user?.role === 'admin') {
    navItems.push({ name: 'النسخ الاحتياطي', path: '/backup', icon: Cloud });
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-brand-main text-brand-third flex flex-col h-full shadow-lg transition-all duration-300`}>
      <div className="p-6 border-b border-brand-third/10 flex items-center justify-between">
        <div className="flex items-center justify-center flex-1">
          <img src={logo} alt="شعار نجار" className={`h-16 w-auto transition-all duration-300 ${isCollapsed ? 'scale-0 opacity-0 h-0' : ''}`} />
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className={`p-4 border-b border-brand-third/10 ${isCollapsed ? 'hidden' : 'block'}`}>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary/80 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث سريع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-brand-third/10 border-none rounded-xl text-xs font-bold placeholder-brand-secondary/60 outline-none focus:ring-1 focus:ring-brand-secondary/50 transition-all"
          />
        </form>
      </div>
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-2 overflow-y-auto scrollbar-hide`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-brand-secondary text-brand-main font-bold shadow-lg shadow-black/10' 
                  : 'hover:bg-brand-third/10 text-brand-third/80 hover:text-brand-third'
              }`}
            >
              <item.icon 
                className={`flex-shrink-0 ${isActive ? 'text-brand-main' : 'text-brand-secondary'}`} 
                size={isCollapsed ? 22 : 22}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-brand-third/10">
        <button
          onClick={() => setShowPasswordModal(true)}
          className={`w-full flex items-center gap-3 px-4 py-3 mb-4 bg-black/10 rounded-2xl border border-white/5 hover:bg-black/20 transition-all cursor-pointer ${isCollapsed ? 'justify-center px-0 cursor-pointer' : ''}`}
        >
           <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-main font-black shadow-inner flex-shrink-0 cursor-pointer">
              {user?.username[0].toUpperCase()}
           </div>
           {!isCollapsed && (
             <div className="truncate flex-1 text-right cursor-pointer">
                <p className="text-sm font-bold truncate text-white">{user?.username}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{user?.role === 'admin' ? 'مدير' : 'موظف'}</p>
             </div>
           )}
           {!isCollapsed && <KeyRound className="w-4 h-4 text-brand-secondary opacity-60 cursor-pointer" />}
        </button>
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-brand-third/60 hover:bg-brand-third/10 hover:text-brand-third transition-all duration-300 font-bold group cursor-pointer"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 transition-transform group-hover:rotate-12" />
          ) : (
            <Sun className="w-5 h-5 transition-transform group-hover:rotate-90" />
          )}
          {!isCollapsed && <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع المضيء'}</span>}
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-bold group cursor-pointer"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform cursor-pointer" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>

      <div className="p-4 text-[9px] text-center text-brand-third/20 opacity-20 uppercase tracking-[0.3em] font-black">
        الإصدار 1.0.0
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border-theme" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-brand-secondary" />
                تغيير كلمة المرور
              </h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">كلمة المرور القديمة</label>
                <input
                  type="password"
                  required
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-secondary text-brand-main rounded-xl font-black hover:bg-brand-secondary/90 transition shadow-lg"
              >
                حفظ كلمة المرور الجديدة
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

