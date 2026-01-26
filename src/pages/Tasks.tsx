import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTasks, Task } from '../hooks/useTasks';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  User, 
  Calendar,
  AlertCircle,
  Search,
  ArrowLeft,
  X,
  CreditCard,
  Hash,
  Trash2
} from 'lucide-react';
const Tasks = () => {
  const { tasks, loading, error, updateSubtask, addTask, deleteTask } = useTasks();
  const { clients } = useClients();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [newTask, setNewTask] = useState({
    client_id: '',
    title: '',
    description: '',
    delivery_due_date: '',
    total_agreed_price: '',
    deposit_paid: ''
  });

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );

  const getTaskUrgency = (task: Task) => {
    if (!task.delivery_due_date || task.status === 'Delivered' || task.status === 'Cancelled') return { level: 0, label: '', color: '', border: '' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.delivery_due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { level: 4, label: 'متأخر', color: 'bg-red-100 text-red-600', border: 'border-r-4 border-r-red-500' };
    if (diffDays <= 3) return { level: 3, label: 'عاجل جداً', color: 'bg-orange-100 text-orange-600', border: 'border-r-4 border-r-orange-500' };
    if (diffDays <= 7) return { level: 2, label: 'قريباً', color: 'bg-yellow-100 text-yellow-600', border: 'border-r-4 border-r-yellow-500' };
    return { level: 1, label: 'طبيعي', color: 'bg-gray-100 text-gray-600', border: '' };
  };

  const filteredTasks = tasks
    .filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone_1?.includes(searchTerm) ||
      t.phone_2?.includes(searchTerm)
    )
    .sort((a, b) => {
      const urgencyA = getTaskUrgency(a);
      const urgencyB = getTaskUrgency(b);
      
      if (urgencyA.level !== urgencyB.level) {
        return urgencyB.level - urgencyA.level;
      }
      
      const dateA = a.delivery_due_date ? new Date(a.delivery_due_date).getTime() : Infinity;
      const dateB = b.delivery_due_date ? new Date(b.delivery_due_date).getTime() : Infinity;
      return dateA - dateB;
    });

  const displayedTasks = filteredTasks.slice(0, visibleCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTask({
      ...newTask,
      client_id: parseInt(newTask.client_id),
      total_agreed_price: parseFloat(newTask.total_agreed_price),
      deposit_paid: parseFloat(newTask.deposit_paid)
    }, user?.id);
    setIsModalOpen(false);
    setNewTask({ client_id: '', title: '', description: '', delivery_due_date: '', total_agreed_price: '', deposit_paid: '' });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Pending': return { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', icon: <Clock className="w-4 h-4" /> };
      case 'In Progress': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <CreditCard className="w-4 h-4" /> };
      case 'Ready': return { color: 'bg-green-50 text-green-700 border-green-100', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'Delivered': return { color: 'bg-gray-50 text-gray-500 border-gray-100', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'Cancelled': return { color: 'bg-red-50 text-red-700 border-red-100', icon: <X className="w-4 h-4" /> };
      default: return { color: 'bg-gray-50 text-gray-700 border-gray-100', icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-brand-main tracking-tight">المشاريع</h1>
          <p className="text-gray-500 font-medium mt-1">تتبع حالة تصنيع الأثاث والتسليمات</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="بحث في المشاريع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-main/10 outline-none font-medium"
              />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-brand-main text-brand-third font-bold py-3 px-6 rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
           >
             <Plus className="w-5 h-5" />
             <span>مشروع جديد</span>
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {displayedTasks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
            <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">لم يتم العثور على مشاريع</p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const status = getStatusInfo(task.status);
            const urgency = getTaskUrgency(task);
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 p-6 md:p-8 ${urgency.border}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                   <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 ${status.color}`}>
                            {status.icon}
                            {task.status === 'Pending' ? 'قيد الانتظار' : 
                             task.status === 'In Progress' ? 'قيد التنفيذ' :
                             task.status === 'Ready' ? 'جاهز للتسليم' :
                             task.status === 'Delivered' ? 'تم التسليم' : 'ملغي'}
                         </span>
                         {urgency.label && (
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${urgency.color}`}>
                             <AlertCircle className="w-3 h-3" />
                             {urgency.label}
                           </span>
                         )}
                         <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            مشروع رقم {task.id}
                         </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{task.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                         <div className="flex items-center gap-2">
                           <span className="text-brand-main font-bold">العميل:</span>
                           {task.client_name}
                         </div>
                         <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${urgency.level >= 3 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} />
                            {task.delivery_due_date ? `موعد التسليم: ${new Date(task.delivery_due_date).toLocaleDateString('ar-EG')}` : 'موعد غير محدد'}
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
                      <div className="text-center sm:text-right">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">نسبة الإنجاز</p>
                         <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">{task.completion_percent}%</span>
                            <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-green-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                 style={{ width: `${task.completion_percent}%` }}
                               />
                            </div>
                         </div>
                      </div>

                      <Link 
                        to={`/tasks/${task.id}`}
                         className="w-full sm:w-auto bg-gray-50 text-brand-main font-bold py-4 px-8 rounded-2xl hover:bg-brand-secondary hover:text-brand-third hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group"
                      >
                         <span>إدارة المشروع</span>
                         <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </Link>

                      <button 
                        onClick={() => {
                          if(window.confirm('هل أنت متأكد من حذف هذا المشروع؟ سيتم استرداد أي مقدم مدفوع في الخزينة.')) {
                            deleteTask(task.id, user?.id);
                          }
                        }}
                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            );
          })
        )}

        {filteredTasks.length > visibleCount && (
          <div className="pt-8 flex justify-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="px-12 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 hover:text-brand-main transition shadow-sm flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>عرض المزيد من المشاريع</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-2xl font-bold text-brand-main">إضافة مشروع جديد</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition">
                   <X className="w-6 h-6 text-gray-400" />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">العميل</label>
                   <select 
                     required
                     value={newTask.client_id}
                     onChange={(e) => setNewTask({...newTask, client_id: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold appearance-none cursor-pointer"
                   >
                     <option value="">اختر عميلاً...</option>
                     {clients.map(c => (
                       <option key={c.id} value={c.id}>{c.name} - {c.phone_1}</option>
                     ))}
                   </select>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">اسم المشروع / القطعة</label>
                   <input 
                     type="text" required
                     value={newTask.title}
                     onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                     placeholder="مثال: طقم انتريه مودرن"
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">وصف المشروع</label>
                   <textarea 
                     rows={3}
                     value={newTask.description}
                     onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold resize-none"
                     placeholder="تفاصيل المقاسات والخامات..."
                   />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">السعر المتفق عليه</label>
                      <input 
                        type="number" 
                        required
                        value={newTask.total_agreed_price}
                        onChange={(e) => setNewTask({...newTask, total_agreed_price: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-green-600"
                        placeholder="0"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">المقدم المدفوع</label>
                      <input 
                        type="number" 
                        required
                        value={newTask.deposit_paid}
                        onChange={(e) => setNewTask({...newTask, deposit_paid: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-orange-600"
                        placeholder="0"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">تاريخ التسليم المتوقع</label>
                      <input 
                        type="date" 
                        required
                        value={newTask.delivery_due_date}
                        onChange={(e) => setNewTask({...newTask, delivery_due_date: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 bg-gray-100 text-gray-500 font-bold py-5 rounded-2xl hover:bg-gray-200 transition-all"
                   >
                     إلغاء
                   </button>
                   <button 
                     type="submit"
                      className="flex-[2] bg-brand-main text-brand-third font-bold py-5 rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                   >
                     بدء المشروع وحفظ البيانات
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
