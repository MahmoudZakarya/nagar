import React from 'react';
import { useTasks } from '../hooks/useTasks';
import { useSafe } from '../hooks/useSafe';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Wallet,
  ArrowUpLeft,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/nagar-logo-removebg.png';


const EGP = () => <span className="text-[0.65em] font-normal mr-1">جنية</span>;

const Dashboard = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { balance, history, loading: safeLoading } = useSafe();

  const activeTasks = tasks.filter(t => t.status !== 'Delivered' && t.status !== 'Cancelled').length;
  const readyTasks = tasks.filter(t => t.status === 'Ready').length;
  
  const today = new Date();
  const overdueTasks = tasks.filter(t => 
    (t.status === 'In Progress' || t.status === 'Pending') && 
    t.delivery_due_date && 
    new Date(t.delivery_due_date) < today
  ).length;

  const loading = tasksLoading || safeLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="bg-brand-main p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl flex-shrink-0">
            <img src={logo} alt="شعار نجار" className="h-10 md:h-16 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-text-primary tracking-tight">نظرة عامة</h1>
            <p className="text-text-secondary text-sm md:text-base font-medium mt-1">مرحباً بك مجدداً! إليك ملخص حالة ورشة نجار اليوم.</p>
          </div>
        </div>
        <div className="text-right md:text-left bg-bg-surface px-6 py-3 rounded-2xl shadow-sm border border-border-theme w-full md:w-auto">
           <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">التاريخ اليوم</p>
           <p className="font-bold text-text-primary">{today.toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Tasks */}
        <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-sm border border-border-theme hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl text-orange-600 dark:text-orange-400 group-hover:bg-brand-secondary group-hover:text-brand-main transition-colors">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-text-muted font-bold text-[10px] uppercase tracking-widest mb-1 relative z-10">مشاريع نشطة</h3>
          <p className="text-5xl font-bold text-text-primary relative z-10">{activeTasks}</p>
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none transform translate-x-2 translate-y-2">
             <ClipboardList className="w-20 h-20" />
          </div>
        </div>

        {/* Ready to Deliver */}
        <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-sm border border-border-theme hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="bg-green-50 dark:bg-green-500/10 p-3 rounded-2xl text-green-600 dark:text-green-400 group-hover:bg-[#5E9E54] group-hover:text-white transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-text-muted font-bold text-[10px] uppercase tracking-widest mb-1 relative z-10">جاهز للتسليم</h3>
          <p className="text-5xl font-bold text-text-primary relative z-10">{readyTasks}</p>
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none transform translate-x-2 translate-y-2">
             <CheckCircle2 className="w-20 h-20" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-sm border border-border-theme hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-2xl text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-text-muted font-bold text-[10px] uppercase tracking-widest mb-1 relative z-10">مشاريع متأخرة</h3>
          <p className="text-5xl font-bold text-text-primary relative z-10">{overdueTasks}</p>
          <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none transform translate-x-2 translate-y-2">
             <AlertCircle className="w-20 h-20" />
          </div>
        </div>
        
        {/* Wallet Balance */}
        <div className="bg-brand-main p-8 rounded-[2.5rem] shadow-2xl shadow-brand-main/20 transition-all duration-500 hover:scale-[1.05] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="bg-white/10 p-3 rounded-2xl text-brand-secondary group-hover:rotate-12 transition-transform">
              <Wallet className="w-8 h-8" />
            </div>
            <TrendingUp className="text-white/20 w-6 h-6" />
          </div>
          <h3 className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-1 relative z-10">رصيد الخزنة</h3>
          <p className="text-4xl font-bold text-white italic relative z-10">{balance.toLocaleString()}<EGP /></p>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-bg-suface rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                 <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-brand-secondary" />
                    آخر المعاملات المالية
                 </h2>
                 <Link to="/safe" className="text-xs font-bold text-text-primary hover:underline uppercase tracking-widest">عرض الكل</Link>
              </div>
              <div className="divide-y divide-gray-50">
                  {history.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition duration-300">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.transaction_type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} shadow-inner`}>
                             {tx.transaction_type === 'Income' ? <ArrowUpLeft className="w-6 h-6" /> : <TrendingUp className="w-6 h-6 rotate-180" />}
                          </div>
                           <div>
                              <p className="font-bold text-text-primary text-lg">
                                 {(() => {
                                   const mapping: Record<string, string> = {
                                     'Client Deposit': 'دفعة مقدمة',
                                     'Deposit': 'دفعة مقدمة',
                                     'Client Payment': 'دفعة عميل',
                                     'Final Payment': 'دفعة نهائية',
                                     'Supplies': 'مشتريات خامات',
                                     'Purchase': 'مشتريات خامات',
                                     'Purchases': 'مشتريات خامات',
                                     'Labor': 'أجور صنايعية',
                                     'Rent': 'إيجار الورشة',
                                     'Electric': 'كهرباء / خدمات',
                                     'Refund': 'استرداد',
                                     'Payroll': 'رواتب',
                                     'Other': 'أخرى'
                                   };
                                   return mapping[tx.category] || tx.category;
                                 })()}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString('ar-EG')}</p>
                           </div>
                        </div>
                        <p className={`text-xl font-bold italic ${tx.transaction_type === 'Income' ? 'text-green-600' : 'text-red-500'}`}>
                           {tx.transaction_type === 'Income' ? '+' : '-'}{tx.amount.toLocaleString()}<EGP />
                        </p>
                     </div>
                 ))}
                 {history.length === 0 && (
                    <div className="p-20 text-center text-gray-400 italic">لا توجد معاملات بعد</div>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-1">
           <div className="bg-bg-surface rounded-[3rem] shadow-sm border border-border-theme p-8 h-full relative overflow-hidden">
              <h2 className="text-xl font-bold text-text-primary mb-8 flex items-center gap-3 relative z-10">
                  <Clock className="w-6 h-6 text-brand-main dark:text-brand-secondary" />
                 مواعيد التسليم القادمة
              </h2>
              <div className="space-y-8 relative z-10">
                 {tasks
                   .filter(t => t.status !== 'Delivered' && t.delivery_due_date)
                   .sort((a, b) => new Date(a.delivery_due_date!).getTime() - new Date(b.delivery_due_date!).getTime())
                   .slice(0, 5)
                   .map(task => {
                     const dueDate = new Date(task.delivery_due_date!);
                     const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                     
                     let colorClass = "before:bg-green-500"; // Default/Delivered (though we filter Delivered)
                     if (diffDays < 0 || (diffDays === 0 && today.toDateString() === dueDate.toDateString())) {
                       colorClass = "before:bg-red-600"; // Overdue or Today
                     } else if (diffDays <= 3) {
                       colorClass = "before:bg-orange-500"; // Within 3 days
                     } else if (diffDays <= 7) {
                       colorClass = "before:bg-yellow-400"; // Within 7 days
                     }

                     return (
                      <Link to={`/tasks/${task.id}`} key={task.id} className="block group">
                          <div className={`relative pr-6 before:absolute before:right-0 before:top-1 before:bottom-1 before:w-1.5 ${colorClass} before:rounded-full group-hover:before:w-2 transition-all`}>
                             <p className="text-xs font-bold text-text-muted mb-1">{dueDate.toLocaleDateString('ar-EG')}</p>
                             <p className="font-bold text-text-primary text-lg leading-tight group-hover:text-brand-main dark:group-hover:text-brand-secondary transition">{task.title}</p>
                             <p className="text-xs text-text-secondary mt-1 font-bold">{task.client_name}</p>
                          </div>
                      </Link>
                     );
                   })}
                 {tasks.length === 0 && (
                    <div className="py-20 text-center text-text-muted italic">لا توجد مواعيد تسليم مجدولة</div>
                 )}
              </div>
              <div className="absolute left-0 bottom-0 p-8 opacity-5 pointer-events-none transform rotate-12 translate-x-4 translate-y-4">
                 <Clock className="w-48 h-48 text-text-primary" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
