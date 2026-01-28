import React, { useState } from 'react';
import { useSafe } from '../hooks/useSafe';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  History,
  X,
  CreditCard,
  PieChart,
  Coins,
  User,
  Landmark
} from 'lucide-react';

const EGP = () => <span className="text-[0.65em] font-normal mr-1">جنية</span>;

import { useAuth } from '../context/AuthContext';

const Safe = () => {
  const { balance, history, loading, error, addTransaction } = useSafe();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Date Filter State
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [dateFilter, setDateFilter] = useState({
    start: defaultStartDate,
    end: defaultEndDate
  });
  
  const [appliedDates, setAppliedDates] = useState({
    start: defaultStartDate,
    end: defaultEndDate
  });

  const [newTx, setNewTx] = useState({
    transaction_type: 'Income' as 'Income' | 'Expense',
    amount: '',
    category: '',
    description: ''
  });

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );

  // RBAC: Only Admin or Manager can access Safe
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center p-20 text-center space-y-6 animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <X className="w-12 h-12" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">عذراً، الوصول غير مسموح</h1>
          <p className="text-text-secondary font-medium">هذه الصفحة مخصصة لمدير النظام فقط. لا تملك الصلاحيات الكافية لعرض البيانات المالية.</p>
        </div>
      </div>
    );
  }
  
  const filteredHistory = history.filter(h => {
    const matchesSearch = h.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const txDate = h.date.split('T')[0];
    const matchesDate = txDate >= appliedDates.start && txDate <= appliedDates.end;
    
    return matchesSearch && matchesDate;
  });

  // Dynamic monthly stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyIncome = history
    .filter(tx => tx.transaction_type === 'Income' && new Date(tx.date) >= firstDayOfMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpenses = history
    .filter(tx => tx.transaction_type === 'Expense' && new Date(tx.date) >= firstDayOfMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransaction({
      ...newTx,
      amount: parseFloat(newTx.amount as string),
      performed_by_id: user?.id
    });
    setShowAddModal(false);
    setNewTx({ transaction_type: 'Income', amount: '', category: '', description: '' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header & Balance Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-2 mb-2"
                    ><Landmark className="w-10 h-10 text-brand-secondary" />الخزنة والماليات</h1>
          <p className="text-text-secondary font-medium text-sm mt-1">تتبع التدفقات النقدية والمصاريف</p>
        </div>
        
        <div className="bg-brand-main p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-brand-main/30 flex items-center gap-4 md:gap-8 min-w-0 w-full md:min-w-[350px] relative overflow-hidden group">
          <div className="bg-white/10 p-4 rounded-2xl text-white group-hover:scale-110 transition-transform duration-500 relative z-10">
            <Wallet className="w-10 h-10 text-brand-secondary" />
          </div>
          <div className="relative z-10">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">إجمالي الرصيد الحالي</p>
            <p className="text-5xl font-bold text-white italic tracking-tighter">{balance.toLocaleString()}<EGP /></p>
          </div>
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left: Stats & Actions */}
        <div className="lg:col-span-1 space-y-6">
           <button 
             onClick={() => setShowAddModal(true)}
             className="w-full bg-brand-secondary text-brand-main font-bold py-5 rounded-[2rem] shadow-xl shadow-brand-secondary/20 hover:shadow-brand-secondary/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
           >
             <div className="bg-brand-main text-brand-third p-1 rounded-lg group-hover:rotate-90 transition-transform duration-500">
                <Plus className="w-5 h-5" />
             </div>
             <span>إضافة معاملة يدوية</span>
           </button>

           <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme space-y-6">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-3">
                 <PieChart className="w-5 h-5 text-brand-secondary" />
                 ملخص سريع
              </h3>
              <div className="space-y-4">
                 <div className="p-4 bg-green-200/5 rounded-2xl">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">أرباح الشهر</p>
                    <p className="text-xl font-bold text-green-700">+{monthlyIncome.toLocaleString()}<EGP /></p>
                 </div>
                 <div className="p-4 bg-red-200/5 rounded-2xl">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">مصروفات الشهر</p>
                    <p className="text-xl font-bold text-red-700">-{monthlyExpenses.toLocaleString()}<EGP /></p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: History List */}
         <div className="lg:col-span-3 space-y-6">
           <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden">
              <div className="p-6 md:p-8 border-b border-border-theme flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-primary/30">
                 <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bg-surface rounded-xl shadow-sm border border-border-theme">
                       <History className="w-5 h-5 text-text-muted" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">سجل المعاملات</h2>
                 </div>
                  <div className="flex items-center gap-2 bg-bg-surface px-4 py-2 rounded-2xl shadow-sm border border-border-theme">
                      <label className="text-[10px] font-bold text-text-muted uppercase whitespace-nowrap">من</label>
                      <input 
                        type="date" 
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                        className="bg-transparent border-none outline-none font-bold text-sm text-text-secondary"
                      />
                      <label className="text-[10px] font-bold text-text-muted uppercase whitespace-nowrap">إلى</label>
                      <input 
                        type="date" 
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                        className="bg-transparent border-none outline-none font-bold text-sm text-text-secondary"
                      />
                      <button 
                        onClick={() => setAppliedDates({...dateFilter})}
                        className="bg-brand-main text-white px-4 py-1 rounded-xl text-xs font-bold hover:bg-brand-main/90 transition cursor-pointer"
                      >
                        عرض
                      </button>
                    </div>
                 </div>
                 
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                       <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                       <input 
                         type="text" 
                         placeholder="بحث في المعاملات..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="pr-10 pl-4 py-2.5 bg-bg-surface border border-border-theme rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-main/10 outline-none font-medium w-full text-sm text-text-primary"
                       />
                    </div>
                 </div>
              </div>

              <div className="divide-y divide-gray-50">
                 {filteredHistory.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 italic">لا توجد معاملات بعد</div>
                 ) : (
                    filteredHistory.map((tx) => (
                       <div key={tx.id} className="p-6 flex items-center gap-6 hover:bg-gray-50/50 transition duration-300">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.transaction_type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} shadow-inner`}>
                             {tx.transaction_type === 'Income' ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                          </div>
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-text-primary text-lg">
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
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${tx.transaction_type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                     {tx.transaction_type === 'Income' ? 'دخل' : 'صرف'}
                                  </span>
                               </div>
                               {(() => {
                                 let desc = tx.description || '-';
                                 desc = desc.replace(/Additional payment for Task #(\d+):/g, 'دفعة إضافية للمشروع رقم $1:');
                                 desc = desc.replace(/Deposit for Task #(\d+):/g, 'عربون مشروع رقم $1:');
                                 desc = desc.replace(/Payment for purchase:/g, 'دفع لفاتورة شراء:');
                                 desc = desc.replace(/Remaining payment for purchase:/g, 'سداد متبقي لمشتريات:');
                                 desc = desc.replace(/Refund for deleted task/g, 'إلغاء مشروع واسترداد مقدم');
                                 return <p className="text-gray-400 text-sm font-medium">{desc}</p>;
                               })()}
                            </div>
                           <div className="text-left flex flex-col items-end">
                              <p className={`text-2xl font-bold ${tx.transaction_type === 'Income' ? 'text-green-600' : 'text-red-500'} italic`}>
                                 {tx.transaction_type === 'Income' ? '+' : '-'}{tx.amount.toLocaleString()}<EGP />
                              </p>
                              <div className="flex flex-col items-end gap-1 mt-1">
                                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('ar-EG')}</p>
                                 {tx.performed_by_name && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                       <User className="w-2.5 h-2.5 text-gray-400" />
                                        <span className="text-[9px] font-black text-gray-500">{tx.performed_by_name}</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Manual Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg-primary/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-bg-primary w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-bg-surface/50">
                <h2 className="text-2xl font-bold text-text-primary">إضافة معاملة جديدة</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl transition">
                   <X className="w-6 h-6 text-gray-400" />
                </button>
             </div>
             
             <form onSubmit={handleAdd} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                 <div className="flex gap-4 p-1.5 bg-bg-primary rounded-2xl border border-border-theme">
                   <button 
                    type="button"
                    onClick={() => setNewTx({...newTx, transaction_type: 'Income'})}
                    className={`flex-1 py-4 cursor-pointer rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${newTx.transaction_type === 'Income' ? 'bg-bg-surface text-green-600 shadow-sm scale-[1.02] border border-border-theme' : 'text-text-muted'}`}
                   >
                     <TrendingUp className="w-5 h-5" />
                     وارد / دخل
                   </button>
                   <button 
                    type="button"
                    onClick={() => setNewTx({...newTx, transaction_type: 'Expense'})}
                    className={`flex-1 py-4 cursor-pointer rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${newTx.transaction_type === 'Expense' ? 'bg-bg-surface text-red-600 shadow-sm scale-[1.02] border border-border-theme' : 'text-text-muted'}`}
                   >
                     <TrendingDown className="w-5 h-5" />
                     صادر / صرف
                   </button>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">المبلغ (<EGP />)</label>
                      <input 
                        type="number" 
                        required
                        value={newTx.amount}
                        onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                         className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold italic text-xl text-text-primary"
                        placeholder="0.00"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">الفئة</label>
                      <select 
                        required
                        value={newTx.category}
                        onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                         className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                      >
                         <option value="">اختر الفئة...</option>
                         <option value="دفعة مقدمة">عربون عميل</option>
                         <option value="دفعة نهائية">دفعة نهائية</option>
                         <option value="مشتريات خامات">مشتريات خامات</option>
                         <option value="أجور صنايعية">أجور صنايعية</option>
                         <option value="إيجار الورشة">إيجار الورشة</option>
                         <option value="كهرباء / خدمات">كهرباء / خدمات</option>
                         <option value="أخرى">أخرى</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">ملاحظات إضافية</label>
                   <textarea 
                     rows={3}
                     value={newTx.description}
                     onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold resize-none text-text-primary"
                     placeholder="تفاصيل المعاملة..."
                   />
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                      className="w-full bg-brand-secondary text-text-primary font-bold py-5 rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
                   >
                     <CreditCard className="w-6 h-6" />
                     تسجيل المعاملة في الخزنة
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Safe;
