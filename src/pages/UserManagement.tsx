import { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Edit, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import API_URL from '../config/api';

interface DBUser {
  id: number;
  username: string;
  role: string;
  status: string;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  
  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  // Edit user form state
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword, 
          role: newRole 
        }),
      });

      if (response.ok) {
        toast.success('تم إنشاء المستخدم بنجاح');
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        setIsAdding(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في إنشاء المستخدم');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        toast.success('تم تحديث الصلاحية بنجاح');
        fetchUsers();
      } else {
        toast.error('فشل في تحديث الصلاحية');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {};
      if (editPassword) updateData.password = editPassword;
      if (editRole) updateData.role = editRole;
      if (editStatus) updateData.status = editStatus;

      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('تم تحديث المستخدم بنجاح');
        setEditingUser(null);
        setEditPassword('');
        setEditRole('');
        setEditStatus('');
        fetchUsers();
      } else {
        toast.error('فشل في تحديث المستخدم');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-secondary" />
            إدارة المستخدمين
          </h1>
          <p className="text-text-secondary font-bold">إدارة طاقم العمل وتحديد صلاحيات الوصول</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-brand-third rounded-2xl font-bold hover:bg-brand-secondary/80 transition shadow-lg shadow-brand-secondary/20 cursor-pointer"
        >
          {isAdding ? <ArrowRight className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {isAdding ? 'العودة للقائمة' : 'إضافة مستخدم جديد'}
        </button>
      </header>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-bg-surface rounded-[2.5rem] p-8 shadow-xl border border-border-theme">
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary px-2">اسم المستخدم</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 focus:bg-bg-primary/10 transition-all duration-300 outline-none text-text-primary"
                placeholder="أدخل اسم المستخدم..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary px-2">كلمة المرور</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 focus:bg-bg-primary/10 outline-none transition font-bold text-text-primary"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary px-2">الصلاحية</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 hover:bg-bg-surface outline-none transition font-bold appearance-none text-text-primary cursor-pointer"
              >
                <option value="user">موظف (User)</option>
                <option value="manager">مدير (Manager)</option>
                <option value="admin">مسؤول نظام (Admin)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-brand-secondary text-brand-main rounded-2xl font-bold text-lg hover:bg-brand-secondary/90 transition shadow-lg shadow-brand-secondary/20 cursor-pointer"
            >
              إنشاء حساب جديد
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 text-brand-main font-bold">جاري تحميل البيانات...</div>
          ) : users.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold">لا يوجد مستخدمين مضافين حالياً</div>
          ) : (
            users.map((dbUser) => (
              <div key={dbUser.id} className="bg-bg-surface rounded-[2rem] p-6 shadow-lg border border-border-theme hover:shadow-xl transition relative group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center border border-border-theme">
                    <User className="w-8 h-8 text-brand-main dark:text-brand-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-text-primary">{dbUser.username}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-brand-secondary" />
                        <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">
                          {dbUser.role === 'admin' ? 'التحكم الكامل' : dbUser.role === 'manager' ? 'مدير' : 'موظف'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        dbUser.status === 'Active' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {dbUser.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                     <button
                    onClick={() => {
                      setEditingUser(dbUser);
                      setEditRole(dbUser.role);
                      setEditStatus(dbUser.status);
                    }}
                    disabled={dbUser.username === 'admin'}
                    className="px-3 mt-3 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main dark:text-brand-secondary rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                  </div>
                 
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border-theme" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
                <Edit className="w-6 h-6 text-brand-secondary" />
                تعديل مستخدم: {editingUser.username}
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">كلمة مرور جديدة (اختياري)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none text-text-primary"
                  placeholder="اتركها فارغة للإبقاء على كلمة المرور الحالية"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">الصلاحية</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none font-bold text-text-primary"
                >
                  <option value="user">موظف (User)</option>
                  <option value="manager">مدير (Manager)</option>
                  <option value="admin">مسؤول نظام (Admin)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">الحالة</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/20 outline-none font-bold text-text-primary"
                >
                  <option value="Active">نشط</option>
                  <option value="Inactive">غير نشط</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-secondary text-brand-main rounded-xl font-bold hover:bg-brand-secondary/90 transition shadow-lg cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
