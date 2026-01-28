import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useTasks } from '../hooks/useTasks';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Calendar, 
  ArrowRight,
  ChevronLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  FileText,
  Plus,
  Eye,
  X,
} from 'lucide-react';
import { useQuotations, Quotation } from '../hooks/useQuotations';

const EGP = () => <span className="text-[0.65em] font-normal mr-1">جنية</span>;

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient } = useClients();
  const { tasks } = useTasks();
  const { getQuotationsByClient } = useQuotations();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'quotations'>('projects');
  
  const client = clients.find(c => c.id === Number(id));
  const clientTasks = tasks.filter(t => t.client_id === Number(id));
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone_1: '',
    phone_2: '',
    address: ''
  });

  useEffect(() => {
    if (id) {
       getQuotationsByClient(Number(id)).then(setQuotations);
    }
  }, [id, getQuotationsByClient]);

  const openModal = () => {
    if (client) {
      setClientForm({
        name: client.name,
        phone_1: client.phone_1,
        phone_2: client.phone_2 || '',
        address: client.address || ''
      });
      setIsModalOpen(true);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await updateClient(Number(id), clientForm);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  if (!client) {
    return (
      <div className="p-20 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme">
          <User className="w-10 h-10 text-text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">العميل غير موجود</h2>
        <button onClick={() => navigate('/clients')} className="text-brand-main dark:text-brand-secondary font-bold hover:underline cursor-pointer">العودة لقائمة العملاء</button>
      </div>
    );
  }

  const filteredTasks = clientTasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clientTasks.length,
    completed: clientTasks.filter(t => t.status === 'Delivered').length,
    active: clientTasks.filter(t => ['Pending', 'In Progress', 'Ready'].includes(t.status)).length,
    totalSpent: clientTasks.reduce((sum, t) => sum + (t.total_agreed_price + (t.extra_costs || 0)), 0)
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/clients')}
          className="p-3 bg-bg-surface rounded-2xl cursor-pointer shadow-sm border border-border-theme hover:bg-bg-primary transition"
        >
          <ArrowRight className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-text-muted">
          <Link to="/clients" className="hover:text-brand-main dark:hover:text-brand-secondary">العملاء</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-text-primary">ملف العميل</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Client Info Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-main/5 to-brand-secondary/5 dark:from-brand-main/10 dark:to-brand-secondary/10"></div>
              
              <div className="relative pt-4">
                 <div className="w-24 h-24 bg-brand-main rounded-full flex items-center justify-center text-brand-third text-3xl font-bold mx-auto mb-6 shadow-xl shadow-brand-main/20 border-4 border-bg-surface">
                    {client.name.charAt(0)}
                 </div>
                 <h1 className="text-2xl font-bold text-text-primary mb-1">{client.name}</h1>
                 <p className="text-text-muted font-bold text-sm">عميل منذ {new Date(client.created_at).toLocaleDateString('ar-EG')}</p>
              </div>

              <div className="mt-10 space-y-4 text-right">
                 <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-2xl group hover:bg-brand-secondary/10 transition duration-300 border border-border-theme/10">
                    <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300 border border-border-theme/10">
                       <Phone className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">الهاتف الأساسي</p>
                       <p className="font-bold text-text-primary" dir="ltr">{client.phone_1}</p>
                    </div>
                 </div>

                 {client.phone_2 && (
                    <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-2xl group hover:bg-brand-main/10 transition duration-300 border border-border-theme/10">
                       <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300 border border-border-theme/10">
                           <Phone className="w-5 h-5 text-brand-secondary" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">الهاتف الإضافي</p>
                          <p className="font-bold text-text-primary" dir="ltr">{client.phone_2}</p>
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-2xl group hover:bg-brand-main/10 transition duration-300 border border-border-theme/10">
                    <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300 border border-border-theme/10">
                       <MapPin className="w-5 h-5 text-brand-secondary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">العنوان</p>
                       <p className="font-bold text-text-primary">{client.address || 'غير مسجل'}</p>
                    </div>
                 </div>
              </div>
              
              <button 
                onClick={openModal}
                className="w-full mt-8 py-4 border-2 border-dashed border-gray-100 cursor-pointer rounded-2xl text-text-400 font-bold text-sm hover:border-brand-main/20 hover:text-brand-secondary transition flex items-center justify-center gap-2"
              >
                 <Edit className="w-4 h-4" />
                 تعديل البيانات
              </button> 
           </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-main dark:bg-brand-main/80 p-6 rounded-[2rem] text-brand-third shadow-lg shadow-brand-main/20 col-span-2">
                  <p className="text-white/80 text-[12px] font-bold uppercase tracking-widest mb-1">إجمالي المعاملات</p>
                  <p className="text-3xl font-bold italic">{stats.totalSpent.toLocaleString()}<EGP /></p>
               </div>
               <div className="bg-bg-surface p-6 rounded-[2rem] shadow-sm border border-border-theme">
                  <p className="text-text-muted text-[12px] font-bold uppercase tracking-widest mb-1">مشاريع منجزة</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.completed}</p>
               </div>
               <div className="bg-bg-surface p-6 rounded-[2rem] shadow-sm border border-border-theme">
                  <p className="text-text-muted text-[12px] font-bold uppercase tracking-widest mb-1">مشاريع نشطة</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
               </div>
            </div>
        </div>

        {/* Right: Projects History */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden min-h-[600px]">
               <div className="p-6 md:p-8 border-b border-border-theme flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-primary/20">
                  <div className="flex gap-6">
                     <button 
                       onClick={() => setActiveTab('projects')}
                       className={`text-xl font-bold transition-colors cursor-pointer ${activeTab === 'projects' ? 'text-text-primary border-b-2 border-brand-main dark:border-brand-secondary cursor-pointer' : 'text-text-muted hover:text-text-secondary cursor-pointer'}`}
                     >
                       المشاريع
                     </button>
                     <button 
                       onClick={() => setActiveTab('quotations')}
                       className={`text-xl font-bold transition-colors ${activeTab === 'quotations' ? 'text-text-primary border-b-2 border-brand-main dark:border-brand-secondary cursor-pointer' : 'text-text-muted hover:text-text-secondary cursor-pointer'}`}
                     >
                       عروض الأسعار
                     </button>
                  </div>
                  {activeTab === 'projects' ? (
                  <div className="relative w-full md:w-64">
                     <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                     <input 
                       type="text" 
                       placeholder="بحث في المشاريع..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pr-10 pl-4 py-2.5 bg-bg-surface border border-border-theme rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-main/10 outline-none font-medium w-full text-sm text-text-primary"
                     />
                  </div>
                  ) : (
                    <button
                      onClick={() => navigate('/quotations/new')}
                      className="flex items-center gap-2 px-4 py-2 font-bold bg-brand-main dark:bg-brand-secondary text-brand-third dark:text-brand-main rounded-xl hover:opacity-90 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>عرض سعر جديد</span>
                    </button>
                  )}
               </div>

              <div className="divide-y divide-border-theme">
                  {activeTab === 'projects' ? (
                    filteredTasks.length === 0 ? (
                      <div className="py-32 text-center text-text-muted italic font-bold">لا توجد مشاريع مسجلة لهذا العميل.</div>
                    ) : (
                      filteredTasks.map((task) => (
                        <Link 
                          to={`/tasks/${task.id}`} 
                          key={task.id} 
                          className="p-4 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-bg-primary/50 transition group transition-colors"
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-border-theme/10 ${
                            task.status === 'Delivered' ? 'bg-green-100/10 text-green-600' : 
                            task.status === 'In Progress' ? 'bg-blue-100/10 text-blue-600' : 'bg-orange-100/10 text-orange-600'
                          }`}>
                            <Package className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-text-primary text-lg group-hover:text-brand-main dark:group-hover:text-brand-secondary transition">{task.title}</h3>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                  task.status === 'Delivered' ? 'bg-green-50/10 text-green-500' : 
                                  task.status === 'In Progress' ? 'bg-blue-50/10 text-blue-500' : 'bg-orange-50/10 text-orange-500'
                                }`}>
                                                                         {task.status === 'Pending' ? 'منتظر' : 
                                      task.status === 'In Progress' ? 'قيد التنفيذ' :
                                      task.status === 'Ready' ? 'جاهز للتسليم' :
                                      task.status === 'Delivered' ? 'تم التسليم' : 'ملغي'}
                                </span>
                              </div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>تسجيل: {new Date(task.registered_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-border-theme rounded-full"></div>
                                    <div className="flex items-center gap-1 text-orange-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>تسليم: {task.delivery_due_date ? new Date(task.delivery_due_date).toLocaleDateString('ar-EG') : 'بدون'}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-border-theme rounded-full"></div>
                                    <span>{task.completion_percent}% إنجاز</span>
                                  </div>
                          </div>
                          <div className="text-left">
                              <p className="text-xl font-bold text-text-primary italic">{(task.total_agreed_price + (task.extra_costs || 0)).toLocaleString()}<EGP /></p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${task.final_payment_status === 'Settled' ? 'text-green-500' : 'text-orange-500'}`}>
                                {task.final_payment_status === 'Settled' ? 'خالص' : 'متبقي'}
                              </p>
                          </div>
                           <ChevronLeft className="w-6 h-6 text-text-muted group-hover:text-brand-main dark:group-hover:text-brand-secondary transition transform group-hover:-translate-x-1" />
                        </Link>
                      ))
                    )
                  ) : (
                    quotations.length === 0 ? (
                      <div className="py-32 text-center text-text-muted italic font-bold">لا توجد عروض أسعار مسجلة لهذا العميل.</div>
                    ) : (
                       quotations.map((quotation) => (
                         <div key={quotation.id} className="p-4 md:p-8 flex items-center justify-between hover:bg-bg-primary/50 transition group transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center border border-border-theme/10">
                                  <FileText className="w-6 h-6" />
                               </div>
                               <div>
                                  <h3 className="font-bold text-text-primary">{quotation.quotation_number}</h3>
                                  <p className="text-sm text-text-muted">{new Date(quotation.created_at).toLocaleDateString('ar-EG')}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                               <div className="text-left">
                                  <p className="font-bold text-text-primary">{quotation.total_amount.toLocaleString()} <span className="text-xs font-normal">جنية</span></p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    quotation.status === 'Accepted' ? 'bg-green-100/10 text-green-500' :
                                    quotation.status === 'Rejected' ? 'bg-red-100/10 text-red-500' :
                                    quotation.status === 'Sent' ? 'bg-blue-100/10 text-blue-500' :
                                    'bg-bg-primary text-text-muted'
                                  }`}>
                                    {quotation.status === 'Draft' ? 'مسودة' :
                                     quotation.status === 'Sent' ? 'تم الإرسال' :
                                     quotation.status === 'Accepted' ? 'مقبول' : 'مرفوض'}
                                  </span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => navigate(`/quotations/${quotation.id}/preview`)}
                                    className="p-2 text-text-muted hover:text-brand-main dark:hover:text-brand-secondary hover:bg-bg-primary rounded-lg transition cursor-pointer"
                                    title="معاينة"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                                    className="p-2 text-text-muted hover:text-brand-main dark:hover:text-brand-secondary hover:bg-bg-primary rounded-lg transition cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                               </div>
                            </div>
                         </div>
                       ))
                    )
                  )}
              </div>
           </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-bg-primary w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-border-theme">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تعديل بيانات العميل</h2>
                <button onClick={closeModal} className="p-2 hover:bg-bg-surface rounded-xl transition cursor-pointer">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الاسم الكامل</label>
                   <input 
                     type="text" 
                     required
                     value={clientForm.name}
                     onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                     placeholder="مثال: محمد احمد"
                   />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 1</label>
                      <input 
                        type="text" 
                        required
                        value={clientForm.phone_1}
                        onChange={(e) => setClientForm({...clientForm, phone_1: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold italic"
                        placeholder="01xxxxxxxxx"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 2</label>
                      <input 
                        type="text" 
                        value={clientForm.phone_2}
                        onChange={(e) => setClientForm({...clientForm, phone_2: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold italic"
                        placeholder="اختياري"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">العنوان</label>
                   <textarea 
                     rows={3}
                     value={clientForm.address}
                     onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold resize-none"
                     placeholder="عنوان العميل بالتفصيل..."
                   />
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                     className="w-full bg-brand-secondary text-brand-third font-bold py-5 cursor-pointer rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                   >
                     حفظ التغييرات
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
