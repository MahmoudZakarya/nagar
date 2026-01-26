import React, { useState } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import {
  ShoppingBag,
  Plus,
  Search,
  Package,
  DollarSign,
  Truck,
  ArrowLeft,
  X,
  CreditCard,
  Hash,
  AlertCircle,
  CheckCircle2,
  Coins,
  Trash2,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EGP = () => <span className="text-[0.65em] font-normal mr-1">جنية</span>;

const Purchases = () => {
  const { purchases, loading, error, addPurchase, updatePurchasePayment, deletePurchase } = usePurchases();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Remaining'>('All');
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

  const [formData, setFormData] = useState({
    supplier_name: '',
    item_name: '',
    quantity: 1,
    price_per_unit: 0,
    total_cost: 0,
    discount_received: 0,
    amount_paid_now: 0
  });

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || p.amount_remaining > 0;
    
    const pDate = p.date.split('T')[0];
    const matchesDate = pDate >= appliedDates.start && pDate <= appliedDates.end;

    return matchesSearch && matchesFilter && matchesDate;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPurchase(formData, user?.id);
    setShowAddModal(false);
    setFormData({
      supplier_name: '',
      item_name: '',
      quantity: 1,
      price_per_unit: 0,
      total_cost: 0,
      discount_received: 0,
      amount_paid_now: 0
    });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || !selectedPurchase) return;
    await updatePurchasePayment(selectedPurchase.id, amount, user?.id);
    setShowPaymentModal(false);
    setSelectedPurchase(null);
    setPaymentAmount('');
  };

  const openPaymentModal = (p: any) => {
    setSelectedPurchase(p);
    setPaymentAmount(p.amount_remaining.toString());
    setShowPaymentModal(true);
  };

  const calculateTotal = (qty: number, price: number, disc: number) => {
    const total = qty * price - disc;
    setFormData({...formData, quantity: qty, price_per_unit: price, discount_received: disc, total_cost: total});
  };

  const totalDebt = purchases.reduce((acc, p) => acc + p.amount_remaining, 0);
  const totalSpent = purchases.reduce((acc, p) => acc + p.total_cost, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">المشتريات والخامات</h1>
          <p className="text-text-secondary font-medium mt-1">إدارة فواتير الموردين ومخزون الخامات</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5E9E54] text-white font-bold py-4 px-8 rounded-2xl shadow-green-200 hover:shadow-green-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-3 whitespace-nowrap"
        >
          <Plus className="w-6 h-6" />
          <span>تسجيل فاتورة شراء</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme flex items-center gap-6 relative overflow-hidden group">
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl text-blue-600 dark:text-blue-400 relative z-10 group-hover:scale-110 transition-transform">
               <Package className="w-8 h-8" />
            </div>
            <div className="relative z-10">
               <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">إجمالي الطلبات</p>
               <p className="text-3xl font-bold text-text-primary">{purchases.length}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Package className="w-24 h-24" />
            </div>
         </div>

         <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme flex items-center gap-6 relative overflow-hidden group">
            <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl text-red-600 dark:text-red-400 relative z-10 group-hover:scale-110 transition-transform">
               <DollarSign className="w-8 h-8" />
            </div>
            <div className="relative z-10">
               <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-1">المديونيات للموردين</p>
               <p className="text-3xl font-bold text-red-600 dark:text-red-400">{totalDebt.toLocaleString()}<EGP /></p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <DollarSign className="w-24 h-24" />
            </div>
         </div>

         <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme flex items-center gap-6 relative overflow-hidden group">
            <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-2xl text-green-600 dark:text-green-400 relative z-10 group-hover:scale-110 transition-transform">
               <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="relative z-10">
               <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-1">إجمالي المشتريات</p>
               <p className="text-3xl font-bold text-green-700 dark:text-green-500">{totalSpent.toLocaleString()}<EGP /></p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <ShoppingBag className="w-24 h-24" />
            </div>
         </div>
      </div>

      <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6 items-center ">
           
            <div className="flex flex-col gap-4">
                <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 w-4 h-4" />
                <input
                  type="text"
                  placeholder="بحث في المشتريات أو الموردين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-bg-surface border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#5E9E54]/10 outline-none font-medium"
                />
            </div>
                <div className="flex items-center gap-2 bg-bg-surface px-4 py-2 rounded-2xl shadow-sm border border-border-theme">
                  <div className='flex flex-col gap-1'>
                     <label className="text-[10px] font-bold text-text-muted uppercase whitespace-nowrap">من</label>
                  <input 
                    type="date" 
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                    className="bg-transparent border-none outline-none font-bold text-sm text-text-primary"
                  />

                  </div>
                  <div className='flex flex-col gap-1'>
                  <label className="text-[10px] font-bold text-text-muted uppercase whitespace-nowrap">إلى</label>
                  <input 
                    type="date" 
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                    className="bg-transparent border-none outline-none font-bold text-sm text-text-primary"
                  />
                  </div>
                  <button 
                    onClick={() => setAppliedDates({...dateFilter})}
                    className="bg-[#5E9E54] text-white px-4 py-1 rounded-xl text-xs font-bold hover:bg-[#4D8245] mr-4 transition"
                  >
                    عرض
                  </button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               

               <button
                onClick={() => setActiveFilter('All')}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition rounded-xl ${activeFilter === 'All' ? 'text-[#5E9E54] bg-green-50 dark:bg-green-500/10' : 'text-text-secondary hover:text-text-primary'}`}
               >
                الكل
               </button>
               <button
                onClick={() => setActiveFilter('Remaining')}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition rounded-xl ${activeFilter === 'Remaining' ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
               >
                فواتير متبقية
               </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="">
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-right">التاريخ / الصنف</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-right">المورد</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-center">الكمية</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-left">التكلفة</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-left">المدفوع</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-left">المتبقي</th>
                <th className="p-4 md:p-8 text-xs font-bold text-text-primary uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-gray-700 italic">لا توجد سجلات شراء</td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-primary/50 transition duration-300 group transition-colors">
                    <td className="p-4 md:p-8">
                       <p className="text-[12px] font-bold text-text-muted uppercase tracking-widest mb-1">{new Date(p.date).toLocaleDateString('ar-EG')}</p>
                       <p className="font-bold text-text-primary flex items-center gap-3">
                          <Package className="w-5 h-5 text-text-muted group-hover:text-[#5E9E54] transition" />
                          {p.item_name}
                       </p>
                    </td>
                    <td className="p-4 md:p-8">
                       <div className="flex items-center gap-3 text-text-secondary font-bold">
                          <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center text-text-primary group-hover:bg-brand-secondary group-hover:text-brand-main transition border border-border-theme/10">
                             <Truck className="w-4 h-4" />
                          </div>
                          {p.supplier_name || 'مورد عام'}
                       </div>
                    </td>
                    <td className="p-4 md:p-8 text-center">
                       <span className="text-text-primary font-bold text-lg">{p.quantity}</span>
                       <span className="text-text-muted text-[10px] block font-bold uppercase mt-1">@ {p.price_per_unit}<EGP /></span>
                    </td>
                    <td className="p-4 md:p-8 text-left font-bold text-text-primary text-lg">{p.total_cost.toLocaleString()}<EGP /></td>
                    <td className="p-4 md:p-8 text-left font-bold text-green-600 italic text-lg">{p.amount_paid_now.toLocaleString()}<EGP /></td>
                    <td className="p-4 md:p-8 text-left">
                       {p.amount_remaining > 0 ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-red-100">
                             <AlertCircle className="w-3 h-3" />
                             {p.amount_remaining.toLocaleString()}<EGP />
                          </div>
                       ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-green-100">
                             <CheckCircle2 className="w-3 h-3" />
                             خالص
                          </div>
                       )}
                    </td>
                    <td className="p-4 md:p-8 text-center">
                       <div className="flex items-center justify-center gap-2">
                          {p.amount_remaining > 0 && (
                             <button
                                onClick={() => openPaymentModal(p)}
                                className="px-4 py-2 bg-[#5E9E54] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#4D8245] transition shadow-md shadow-green-200"
                             >
                                سداد
                             </button>
                          )}
                           <button
                             onClick={() => {
                               if(window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم استرداد المبلغ المدفوع في الخزينة.')) {
                                 deletePurchase(p.id, user?.id);
                               }
                             }}
                            className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-2xl rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col shadow-2xl">
             <div className="bg-[#5E9E54] p-10 text-white relative flex-shrink-0">
                <h2 className="text-3xl font-bold">تسجيل فاتورة شراء</h2>
                <p className="text-white/60 font-medium mt-2">أدخل تفاصيل الخامات أو المشتريات من الفاتورة</p>
                <div className="absolute -left-12 -bottom-12 opacity-10 pointer-events-none">
                   <ShoppingBag className="w-64 h-64" />
                </div>
                <button onClick={() => setShowAddModal(false)} className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition">
                   <X className="w-6 h-6 text-white" />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">اسم الصنف / الخامة</label>
                      <input 
                        type="text" required 
                        className="w-full px-6 py-5 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-[#5E9E54]/10 outline-none font-bold text-text-primary"
                        placeholder="مثال: خشب زان، منشار، غراء..."
                        value={formData.item_name}
                        onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">اسم المورد</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-5 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-[#5E9E54]/10 outline-none font-bold text-text-primary"
                        placeholder="شركة توريد الأخشاب"
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 md:p-8 bg-bg-primary border border-border-theme/30 rounded-[2rem]">
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3 text-center">الكمية</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-4 rounded-2xl border border-border-theme/30 bg-bg-surface shadow-inner focus:ring-2 focus:ring-[#5E9E54]/10 transition text-center font-bold text-lg text-text-primary"
                        value={formData.quantity}
                        onChange={(e) => calculateTotal(Number(e.target.value), formData.price_per_unit, formData.discount_received)}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3 text-center">سعر الوحدة</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-4 rounded-2xl border border-border-theme/30 bg-bg-surface shadow-inner focus:ring-2 focus:ring-[#5E9E54]/10 transition text-center font-bold text-lg text-text-primary"
                        value={formData.price_per_unit}
                        onChange={(e) => calculateTotal(formData.quantity, Number(e.target.value), formData.discount_received)}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3 text-center">الخصم</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-4 rounded-2xl border border-border-theme/30 bg-bg-surface shadow-inner focus:ring-2 focus:ring-[#5E9E54]/10 transition text-center font-bold text-lg text-text-primary"
                        value={formData.discount_received}
                        onChange={(e) => calculateTotal(formData.quantity, formData.price_per_unit, Number(e.target.value))}
                      />
                   </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-10 py-6">
                   <div className="flex items-center gap-8">
                      <div>
                         <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">صافي التكلفة</p>
                         <p className="text-4xl font-bold text-text-primary italic tracking-tighter">{formData.total_cost.toLocaleString()}<EGP /></p>
                      </div>
                      <ArrowLeft className="w-6 h-6 text-text-muted/30 mt-4" />
                      <div>
                         <p className="text-[10px] font-bold text-[#5E9E54] uppercase tracking-widest mb-1">المدفوع حالياً</p>
                         <input 
                          type="number"
                          max={formData.total_cost}
                          className="w-32 text-3xl font-bold text-[#5E9E54] bg-transparent border-b-4 border-[#5E9E54]/10 focus:outline-none focus:border-[#5E9E54] transition italic placeholder-[#5E9E54]/20"
                          value={formData.amount_paid_now}
                          onChange={(e) => setFormData({...formData, amount_paid_now: Number(e.target.value)})}
                          placeholder="0.00"
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <button 
                     type="submit"
                     className="w-full bg-[#5E9E54] text-white font-bold py-6 rounded-3xl shadow-2xl shadow-green-100 hover:shadow-green-300 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-4 text-xl group"
                   >
                     <CreditCard className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                     تأكيد عملية الشراء والخصم من الخزنة
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">سداد مديونية</h2>
                <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-text-muted" /></button>
             </div>
             <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                <div>
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 px-1">المتبقي: {selectedPurchase?.amount_remaining.toLocaleString()}<EGP /></p>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">المبلغ المراد دفعه</label>
                   <input 
                     type="number" 
                     required
                     max={selectedPurchase?.amount_remaining}
                     value={paymentAmount}
                     onChange={(e) => setPaymentAmount(e.target.value)}
                     className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-2xl text-center text-text-primary"
                     placeholder="0.00"
                   />
                </div>
                <button type="submit" className="w-full bg-[#5E9E54] text-white font-bold py-5 rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                   <Coins className="w-5 h-5" />
                   تأكيد الدفع
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
