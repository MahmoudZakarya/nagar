import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Hammer, Landmark , ShoppingCart, LogOut, Search, X, BriefcaseBusiness, Contact } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import logo from '../assets/nagar-logo-removebg.png';


const Sidebar = ({ onClose, isCollapsed }: { onClose?: () => void, isCollapsed?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/clients?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'العملاء', path: '/clients', icon: Contact },
    { name: 'المشاريع', path: '/tasks', icon: Hammer },
    { name: 'الخزنة', path: '/safe', icon: Landmark  },
    { name: 'المشتريات', path: '/purchases', icon: ShoppingCart },
    // { name: 'الموظفين', path: '/employees', icon: BriefcaseBusiness},
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navItems.push({ name: 'إدارة المستخدمين', path: '/users', icon: Users });
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-brand-main text-brand-third flex flex-col h-full shadow-lg transition-all duration-300`}>
      <div className="p-6 border-b border-brand-third/10 flex items-center justify-between">
        <div className="flex items-center justify-center flex-1">
          <img src={logo} alt="شعار نجار" className={`h-16 w-auto transition-all duration-300 ${isCollapsed ? 'scale-0 opacity-0 h-0' : ''}`} />
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition"
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
        <div className={`flex items-center gap-3 px-4 py-3 mb-4 bg-black/10 rounded-2xl border border-white/5 ${isCollapsed ? 'justify-center px-0' : ''}`}>
           <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-main font-black shadow-inner flex-shrink-0">
              {user?.username[0].toUpperCase()}
           </div>
           {!isCollapsed && (
             <div className="truncate">
                <p className="text-sm font-bold truncate text-white">{user?.username}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{user?.role === 'admin' ? 'مدير' : 'موظف'}</p>
             </div>
           )}
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-bold group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>

      <div className="p-4 text-[9px] text-center text-brand-third/20 opacity-20 uppercase tracking-[0.3em] font-black">
        الإصدار 1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
