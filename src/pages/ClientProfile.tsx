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
  ArrowLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  FileText,
  Plus,
  Eye
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

  useEffect(() => {
    if (id) {
       getQuotationsByClient(Number(id)).then(setQuotations);
    }
  }, [id, getQuotationsByClient]);

  if (!client) {
    return (
      <div className="p-20 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">العميل غير موجود</h2>
        <button onClick={() => navigate('/clients')} className="text-brand-main font-bold hover:underline">العودة لقائمة العملاء</button>
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
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
          <Link to="/clients" className="hover:text-brand-main">العملاء</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">ملف العميل</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Client Info Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-main/5 to-brand-secondary/5"></div>
              
              <div className="relative pt-4">
                 <div className="w-24 h-24 bg-brand-main rounded-full flex items-center justify-center text-brand-third text-3xl font-bold mx-auto mb-6 shadow-xl shadow-brand-main/20 border-4 border-white">
                    {client.name.charAt(0)}
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 mb-1">{client.name}</h1>
                 <p className="text-gray-400 font-bold text-sm">عميل منذ {new Date(client.created_at).toLocaleDateString('ar-EG')}</p>
              </div>

              <div className="mt-10 space-y-4 text-right">
                 <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-brand-secondary/5 transition duration-300">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300">
                       <Phone className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">الهاتف الأساسي</p>
                       <p className="font-bold text-gray-900" dir="ltr">{client.phone_1}</p>
                    </div>
                 </div>

                 {client.phone_2 && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-brand-main/5 transition duration-300">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300">
                           <Phone className="w-5 h-5 text-brand-secondary" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">الهاتف الإضافي</p>
                          <p className="font-bold text-gray-900" dir="ltr">{client.phone_2}</p>
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-brand-main/5 transition duration-300">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300">
                       <MapPin className="w-5 h-5 text-brand-secondary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">العنوان</p>
                       <p className="font-bold text-gray-900">{client.address || 'غير مسجل'}</p>
                    </div>
                 </div>
              </div>
              
              <button 
                className="w-full mt-8 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-sm hover:border-brand-main/20 hover:text-brand-main transition flex items-center justify-center gap-2"
              >
                 <Edit className="w-4 h-4" />
                 تعديل البيانات
              </button>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-brand-main p-6 rounded-[2rem] text-brand-third shadow-lg shadow-brand-main/20 col-span-2">
                 <p className="text-white text-[12px] font-bold uppercase tracking-widest mb-1">إجمالي المعاملات</p>
                 <p className="text-3xl font-bold italic">{stats.totalSpent.toLocaleString()}<EGP /></p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                 <p className="text-gray-600 text-[12px] font-bold uppercase tracking-widest mb-1">مشاريع منجزة</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                 <p className="text-gray-600 text-[12px] font-bold uppercase tracking-widest mb-1">مشاريع نشطة</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
           </div>
        </div>

        {/* Right: Projects History */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
               <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                  <div className="flex gap-6">
                     <button 
                       onClick={() => setActiveTab('projects')}
                       className={`text-xl font-bold transition-colors ${activeTab === 'projects' ? 'text-gray-900 border-b-2 border-brand-main' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                       المشاريع
                     </button>
                     <button 
                       onClick={() => setActiveTab('quotations')}
                       className={`text-xl font-bold transition-colors ${activeTab === 'quotations' ? 'text-gray-900 border-b-2 border-brand-main' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                       عروض الأسعار
                     </button>
                  </div>
                  {activeTab === 'projects' ? (
                  <div className="relative w-full md:w-64">
                     <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <input 
                       type="text" 
                       placeholder="بحث في المشاريع..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pr-10 pl-4 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-main/10 outline-none font-medium w-full text-sm"
                     />
                  </div>
                  ) : (
                    <button
                      onClick={() => navigate('/quotations/new')}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-main text-brand-third rounded-xl hover:bg-brand-main/90 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>عرض سعر جديد</span>
                    </button>
                  )}
               </div>

              <div className="divide-y divide-gray-50">
                  {activeTab === 'projects' ? (
                    filteredTasks.length === 0 ? (
                      <div className="py-32 text-center text-gray-300 italic font-bold">لا توجد مشاريع مسجلة لهذا العميل.</div>
                    ) : (
                      filteredTasks.map((task) => (
                        <Link 
                          to={`/tasks/${task.id}`} 
                          key={task.id} 
                          className="p-4 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-gray-50/50 transition group"
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                            task.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            <Package className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-main transition">{task.title}</h3>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                  task.status === 'Delivered' ? 'bg-green-50 text-green-600' : 
                                  task.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                                                        {task.status === 'Pending' ? 'منتظر' : 
                                      task.status === 'In Progress' ? 'قيد التنفيذ' :
                                      task.status === 'Ready' ? 'جاهز للتسليم' :
                                      task.status === 'Delivered' ? 'تم التسليم' : 'ملغي'}
                                </span>
                              </div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>تسجيل: {new Date(task.registered_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                    <div className="flex items-center gap-1 text-orange-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>تسليم: {task.delivery_due_date ? new Date(task.delivery_due_date).toLocaleDateString('ar-EG') : 'بدون'}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                    <span>{task.completion_percent}% إنجاز</span>
                                  </div>
                          </div>
                          <div className="text-left">
                              <p className="text-xl font-bold text-gray-900 italic">{(task.total_agreed_price + (task.extra_costs || 0)).toLocaleString()}<EGP /></p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${task.final_payment_status === 'Settled' ? 'text-green-500' : 'text-orange-500'}`}>
                                {task.final_payment_status === 'Settled' ? 'خالص' : 'متبقي'}
                              </p>
                          </div>
                           <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-brand-main transition transform group-hover:-translate-x-1" />
                        </Link>
                      ))
                    )
                  ) : (
                    quotations.length === 0 ? (
                      <div className="py-32 text-center text-gray-300 italic font-bold">لا توجد عروض أسعار مسجلة لهذا العميل.</div>
                    ) : (
                       quotations.map((quotation) => (
                         <div key={quotation.id} className="p-4 md:p-8 flex items-center justify-between hover:bg-gray-50/50 transition group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6" />
                               </div>
                               <div>
                                  <h3 className="font-bold text-gray-900">{quotation.quotation_number}</h3>
                                  <p className="text-sm text-gray-400">{new Date(quotation.created_at).toLocaleDateString('ar-EG')}</p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                               <div className="text-left">
                                  <p className="font-bold text-gray-900">{quotation.total_amount.toLocaleString()} <span className="text-xs font-normal">جنية</span></p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    quotation.status === 'Accepted' ? 'bg-green-100 text-green-600' :
                                    quotation.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                    quotation.status === 'Sent' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {quotation.status === 'Draft' ? 'مسودة' :
                                     quotation.status === 'Sent' ? 'تم الإرسال' :
                                     quotation.status === 'Accepted' ? 'مقبول' : 'مرفوض'}
                                  </span>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => navigate(`/quotations/${quotation.id}/preview`)}
                                    className="p-2 text-gray-400 hover:text-[#854836] hover:bg-[#854836]/5 rounded-lg transition"
                                    title="معاينة"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
                                    className="p-2 text-gray-400 hover:text-[#854836] hover:bg-[#854836]/5 rounded-lg transition"
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
    </div>
  );
};

export default ClientProfile;
