import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  DollarSign,
  ChevronRight,
  Save,
  Edit,
  Trash2,
  Wallet,
  Coins,
  X
} from 'lucide-react';

const EGP = () => <span className="text-[0.65em] font-normal mr-1">جنية</span>;

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { task, payments, loading, error, addSubtask, updateStatus, updateFinancials, updateTask, refetch, addPayment } = useTask(id);
  const { updateSubtask: toggleSubtask } = useTasks();
  
  const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    delivery_due_date: '',
    total_agreed_price: 0,
    extra_costs: 0,
    middle_payment_agreed: 0
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );
  
  if (error || !task) return (
    <div className="p-20 text-center text-red-500 font-bold">عذراً، لم يتم العثور على المشروع</div>
  );

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskDesc.trim()) return;
    await addSubtask(newSubtaskDesc);
    setNewSubtaskDesc('');
  };

  const handleToggle = async (subtaskId: number, current: boolean) => {
    await toggleSubtask(subtaskId, !current);
    refetch();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await addPayment(amount, paymentData.note, paymentData.date, user?.id);
      setPaymentData({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTask({
      title: editForm.title,
      description: editForm.description,
      delivery_due_date: editForm.delivery_due_date
    });
    // For financials, we call a separate update if changed
    await updateFinancials({
      total_agreed_price: editForm.total_agreed_price,
      extra_costs: editForm.extra_costs,
      middle_payment_agreed: editForm.middle_payment_agreed,
      performed_by_id: user?.id
    });
    setShowEditModal(false);
  };

  const openEditModal = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      delivery_due_date: task.delivery_due_date ? new Date(task.delivery_due_date).toISOString().split('T')[0] : '',
      total_agreed_price: task.total_agreed_price,
      extra_costs: task.extra_costs || 0,
      middle_payment_agreed: task.middle_payment_agreed || 0
    });
    setShowEditModal(true);
  };

  const statusOptions = [
    { value: 'Pending', label: 'قيد الانتظار' },
    { value: 'In Progress', label: 'قيد التنفيذ' },
    { value: 'Ready', label: 'جاهز للتسليم' },
    { value: 'Delivered', label: 'تم التسليم' },
    { value: 'Postponed', label: 'مؤجل' },
    { value: 'Cancelled', label: 'ملغي' }
  ];

  const totalCost = (task?.total_agreed_price || 0) + (task?.extra_costs || 0);
  const remaining = totalCost - (task?.deposit_paid || 0);

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/tasks')}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
          >
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <Link to="/tasks" className="hover:text-brand-main">المشاريع</Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-text-primary">تفاصيل المشروع #{id}</span>
          </div>
        </div>

        {user?.role === 'admin' && (
           <button 
             onClick={openEditModal}
             className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-brand-main font-bold rounded-2xl shadow-sm hover:shadow-md transition"
           >
              <Edit className="w-4 h-4" />
              <span>تعديل المشروع</span>
           </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Task Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme p-6 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">{task?.title ?? 'مشروع غير معروف'}</h1>
                <div className="flex items-center gap-4 text-text-secondary font-medium">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-secondary" />
                    <span className="font-bold">{task?.client_name ?? '-'}</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-secondary" />
                    <span>أنشئ في {task?.registered_at ? new Date(task.registered_at).toLocaleDateString('ar-EG') : '-'}</span>
                  </div>
                </div>
              </div>
              <select 
                value={task?.status ?? 'Pending'}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full md:w-auto bg-bg-primary border-none px-6 py-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-brand-main/10 outline-none appearance-none cursor-pointer text-brand-main dark:text-brand-secondary"
              >
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="space-y-8">
               <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">وصف المشروع</h4>
                  <p className="text-text-primary leading-relaxed bg-bg-primary/50 p-6 rounded-3xl whitespace-pre-wrap font-medium">
                    {task?.description || 'لا يوجد وصف متاح.'}
                  </p>
               </div>

                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-6 bg-bg-primary rounded-3xl group hover:bg-brand-main/5 transition duration-300">
                     <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">موعد التسليم</p>
                     <p className="font-bold text-text-primary text-lg">
                        {task?.delivery_due_date ? new Date(task.delivery_due_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                     </p>
                  </div>
                  <div className="p-6 bg-bg-primary rounded-3xl border-b-4 border-green-500">
                     <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">نسبة الإنجاز</p>
                     <p className="font-bold text-text-primary text-lg">{task?.completion_percent ?? 0}%</p>
                  </div>
                  <div className="p-6 bg-bg-primary rounded-3xl">
                     <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">هاتف العميل</p>
                     <p className="font-bold text-text-primary text-lg" dir="ltr">{task?.phone_1 ?? '-'}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden">
             <div className="p-8 border-b border-border-theme bg-bg-primary/20">
                <h3 className="text-xl font-bold text-text-primary">خطوات العمل</h3>
                <p className="text-text-secondary text-sm mt-1 font-medium">تتبع مراحل التصنيع والتركيب خطوة بخطوة.</p>
             </div>
             
             <div className="p-8 space-y-4">
                <form onSubmit={handleAddSubtask} className="flex gap-3 mb-6">
                   <input 
                    type="text" 
                    value={newSubtaskDesc}
                    onChange={(e) => setNewSubtaskDesc(e.target.value)}
                    placeholder="أضف خطوة جديدة (مثال: تقطيع الخشب)..."
                    className="flex-1 px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                   />
                   <button type="submit" className="bg-brand-main text-brand-third p-4 rounded-2xl shadow-lg hover:shadow-brand-main/30 transition transform active:scale-95">
                      <Plus className="w-6 h-6" />
                   </button>
                </form>

                <div className="space-y-3">
                   {task.subtasks?.map(st => (
                      <div 
                        key={st.id} 
                        className="group flex items-center justify-between p-5 bg-bg-surface border border-border-theme rounded-3xl hover:border-brand-main/20 hover:shadow-md transition cursor-pointer"
                        onClick={() => handleToggle(st.id, st.is_completed)}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-1 rounded-full transition ${st.is_completed ? 'text-green-500' : 'text-text-muted hover:text-text-secondary'}`}>
                               {st.is_completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                            </div>
                            <span className={`text-lg font-bold transition ${st.is_completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                               {st.description}
                            </span>
                         </div>
                      </div>
                   ))}
                   {(!task.subtasks || task.subtasks.length === 0) && (
                      <div className="py-12 text-center text-text-muted italic font-bold">لم يتم إضافة خطوات بعد.</div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Financials */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-brand-main rounded-[2.5rem] shadow-xl p-6 md:p-10 text-brand-third relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8 opacity-90">
                   <Wallet className="w-5 h-5" />
                   <span className="text-xs font-bold uppercase tracking-widest">موجز مالي</span>
                </div>
                
                <div className="space-y-8">
                   <div>
                      <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-1">إجمالي المتفق عليه</p>
                      <p className="text-4xl font-bold">{totalCost?.toLocaleString() ?? '0'}</p>
                      {(task?.extra_costs ?? 0) > 0 && (
                         <p className="text-[10px] text-orange-400 mt-1">شامل {task?.extra_costs?.toLocaleString()}<EGP /> مصاريف إضافية</p>
                      )}
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-1">إجمالي المدفوع</p>
                         <p className="text-xl font-bold text-green-400">{task?.deposit_paid?.toLocaleString() ?? '0'}</p>
                      </div>
                      <div>
                         <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-1">المبلغ المتبقي</p>
                         <p className="text-xl font-bold text-orange-400">{remaining?.toLocaleString() ?? '0'}</p>
                      </div>
                   </div>

                   <button 
                     onClick={() => setShowPaymentModal(true)}
                     className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition"
                   >
                      <Coins className="w-5 h-5" />
                      تسجيل دفعة جديدة
                   </button>

                   <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                      <span className="text-white/90 text-xs font-bold uppercase tracking-widest">حالة الحساب</span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        task.final_payment_status === 'Settled' ? 'bg-green-500 text-white' : 
                        task.final_payment_status === 'Partial' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white'
                      }`}>
                         {task.final_payment_status === 'Settled' ? 'خالص' : 
                          task.final_payment_status === 'Partial' ? 'دفعة جزئية' : 'لم يتم الدفع'}
                      </span>
                   </div>
                </div>
              </div>
           </div>

         

            {/* Payment History */}
            <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme p-8 space-y-6">
               <div className="flex items-center justify-between border-b pb-4 border-border-theme">
                  <h3 className="text-lg font-bold text-text-primary">سجل المدفوعات</h3>
                  <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
               </div>
               
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {payments && payments.length > 0 ? (
                    payments.map((p) => (
                      <div key={p.id} className="relative pr-6 pb-6 border-r-2 border-border-theme last:pb-0">
                        <div className="absolute -right-[9px] top-0 w-4 h-4 rounded-full bg-bg-surface border-2 border-orange-400"></div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-m font-bold text-text-primary">{p.amount.toLocaleString()} <EGP /></span>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[14px] font-bold text-text-secondary">{new Date(p.payment_date).toLocaleDateString('ar-EG')}</span>
                            {p.performed_by_name && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-bg-primary rounded-lg border border-border-theme">
                                <User className="w-2.5 h-2.5 text-text-muted" />
                                <span className="text-[8px] font-black text-text-secondary">{p.performed_by_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {p.note && <p className="text-xs text-text-secondary font-medium leading-relaxed">{p.note}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-text-muted italic font-bold text-sm">لا يوجد سجل مدفوعات بعد.</div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <div className="bg-bg-surface w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-border-theme">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تسجيل دفعة نقدية</h2>
                <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-text-muted" /></button>
             </div>
              <form onSubmit={handlePayment} className="p-8 space-y-6">
                <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">المبلغ المدفوع</label>
                   <input 
                     type="number" 
                     required
                     value={paymentData.amount}
                     onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-2xl text-center text-text-primary"
                     placeholder="0.00"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">ملاحظة</label>
                   <textarea 
                     rows={2}
                     value={paymentData.note}
                     onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                     className="w-full pl-12 pr-4 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 focus:bg-bg-surface transition-all duration-300 outline-none text-text-primary"
                     placeholder="أضف ملاحظة للدفعة..."
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">تاريخ الدفعة</label>
                   <input 
                     type="date" 
                     required
                     value={paymentData.date}
                     onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold text-text-primary"
                   />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-5 rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-600/20">تأكيد الدفع</button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal (Admin Only) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-bg-surface w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-border-theme">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تعديل بيانات المشروع الماليّة</h2>
                <button onClick={() => setShowEditModal(false)}><X className="w-6 h-6 text-text-muted" /></button>
             </div>
             <form onSubmit={handleEditTask} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">اسم المشروع</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                      />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">الوصف</label>
                      <textarea 
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold resize-none text-text-primary"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">السعر المتفق عليه</label>
                      <input 
                        type="number" 
                        value={editForm.total_agreed_price}
                        onChange={(e) => setEditForm({...editForm, total_agreed_price: parseFloat(e.target.value)})}
                          className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">تكاليف إضافية</label>
                      <input 
                        type="number" 
                        value={editForm.extra_costs}
                        onChange={(e) => setEditForm({...editForm, extra_costs: parseFloat(e.target.value)})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold text-text-primary"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">موعد التسليم</label>
                      <input 
                        type="date" 
                        value={editForm.delivery_due_date}
                        onChange={(e) => setEditForm({...editForm, delivery_due_date: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold focus:bg-bg-surface text-text-primary"
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-brand-main text-brand-third font-bold py-5 rounded-2xl hover:scale-[1.02] transition shadow-lg shadow-brand-main/20">تحديث البيانات</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
