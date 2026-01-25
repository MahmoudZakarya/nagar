import { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface DBUser {
  id: number;
  username: string;
  role: string;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users');
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
      const response = await fetch('http://localhost:3000/api/auth/register', {
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
      const response = await fetch(`http://localhost:3000/api/users/${userId}/role`, {
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

  return (
    <div className="p-8 animate-in fade-in duration-500 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#854836] mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#FFB22C]" />
            إدارة المستخدمين
          </h1>
          <p className="text-gray-500 font-bold">إدارة طاقم العمل وتحديد صلاحيات الوصول</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-[#854836] text-white rounded-2xl font-bold hover:bg-[#6b3a2b] transition shadow-lg shadow-[#854836]/20"
        >
          {isAdding ? <ArrowRight className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {isAdding ? 'العودة للقائمة' : 'إضافة مستخدم جديد'}
        </button>
      </header>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 px-2">اسم المستخدم</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836] outline-none transition font-bold"
                placeholder="أدخل اسم المستخدم..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 px-2">كلمة المرور</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836] outline-none transition font-bold"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 px-2">الصلاحية</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836] outline-none transition font-bold appearance-none"
              >
                <option value="user">موظف (User)</option>
                <option value="manager">مدير (Manager)</option>
                <option value="admin">مسؤول نظام (Admin)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#FFB22C] text-[#854836] rounded-2xl font-black text-lg hover:bg-yellow-400 transition shadow-lg shadow-yellow-400/20"
            >
              إنشاء حساب جديد
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 text-[#854836] font-bold">جاري تحميل البيانات...</div>
          ) : users.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold">لا يوجد مستخدمين مضافين حالياً</div>
          ) : (
            users.map((dbUser) => (
              <div key={dbUser.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-50 hover:shadow-xl transition relative group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#854836]/10 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-[#854836]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#854836]">{dbUser.username}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-[#FFB22C]" />
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        {dbUser.role === 'admin' ? 'التحكم الكامل' : dbUser.role === 'manager' ? 'مدير' : 'موظف'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-500">تغيير الصلاحية:</span>
                  <div className="flex gap-2">
                    {['user', 'manager', 'admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => handleUpdateRole(dbUser.id, role)}
                        disabled={dbUser.username === 'admin' || dbUser.id === currentUser?.id}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                          dbUser.role === role
                            ? 'bg-[#FFB22C] text-[#854836]'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'User'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
