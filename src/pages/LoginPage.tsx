import React, { useState } from 'react';
import logo from '../assets/nagar-logo-removebg.png';
import { useAuth } from '../context/AuthContext';
import { Hammer, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secendory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-main rounded-3xl shadow-xl mb-6 transform -rotate-6">
            <img src={logo} alt="Nagar Logic" className="h-28 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">نظام نجار</h1>
          <p className="text-text-secondary mt-2 font-medium">نظام إدارة ورشة نجار</p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-surface rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-6 md:p-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2">مرحباً بك مجدداً</h2>
            <p className="text-text-secondary mb-8">يرجى إدخال بياناتك لتسجيل الدخول.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">خطأ: {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-2 ml-1">اسم المستخدم</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-primary" />
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10  transition-all duration-300 outline-none"
                    placeholder="اسم المستخدم"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-2 ml-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-primary" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10  transition-all duration-300 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-main text-brand-third font-bold py-5 rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                     <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>دخول</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="p-6 bg-bg-secondary border-t border-gray-50 text-center">
             <p className="text-text-secondary text-sm">نسيت كلمة المرور؟ تواصل مع المدير.</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-300 text-xs mt-12 font-medium uppercase">
          &copy; 2026 نظام نجار. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
