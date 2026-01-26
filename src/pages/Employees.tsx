import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus,
  Clock,
  Briefcase,
  Trash2,
  Edit,
  DollarSign,
  ChevronLeft,
  Calendar,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Employees = () => {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    address: '',
    phone_1: '',
    phone_2: '',
    relative_name: '',
    relative_phone: '',
    relative_relation: '',
    age: '',
    role: '',
    hourly_rate: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      await updateEmployee(selectedEmployee.id, {
        ...formData,
        age: parseInt(formData.age),
        hourly_rate: parseFloat(formData.hourly_rate)
      });
    } else {
      await addEmployee({
        ...formData,
        age: parseInt(formData.age),
        hourly_rate: parseFloat(formData.hourly_rate)
      });
    }
    closeModal();
  };

  const openModal = (emp?: any) => {
    if (emp) {
      setSelectedEmployee(emp);
      setFormData({
        name: emp.name,
        national_id: emp.national_id || '',
        address: emp.address || '',
        phone_1: emp.phone_1 || '',
        phone_2: emp.phone_2 || '',
        relative_name: emp.relative_name || '',
        relative_phone: emp.relative_phone || '',
        relative_relation: emp.relative_relation || '',
        age: emp.age.toString(),
        role: emp.role,
        hourly_rate: emp.hourly_rate.toString(),
        start_date: emp.start_date.split('T')[0]
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        national_id: '',
        address: '',
        phone_1: '',
        phone_2: '',
        relative_name: '',
        relative_phone: '',
        relative_relation: '',
        age: '',
        role: '',
        hourly_rate: '',
        start_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await deleteEmployee(id);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-brand-main tracking-tight">الموظفين</h1>
          <p className="text-gray-500 font-medium mt-1">إدارة بيانات العمال، الحضور، والرواتب</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="bg-brand-main text-brand-third font-bold py-4 px-8 rounded-2xl shadow-xl shadow-brand-main/20 hover:shadow-brand-main/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
        >
          <UserPlus className="w-6 h-6" />
          <span>تسجيل موظف جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6 items-center bg-gray-50/20">
            <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="بحث عن موظف أو دور..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-main/10 outline-none font-medium"
                />
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl transition duration-500 group relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-brand-main rounded-2xl flex items-center justify-center text-brand-third text-2xl font-bold shadow-lg shadow-brand-main/20 group-hover:scale-110 transition duration-300">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(emp)} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-blue-500 transition">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{emp.name}</h3>
              <p className="text-brand-main font-bold text-sm mb-6 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {emp.role}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200/50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">أجر الساعة</p>
                  <p className="font-bold text-gray-900">{emp.hourly_rate} جنية</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">الحالة</p>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                    emp.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {emp.status === 'Active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              <Link 
                to={`/employees/${emp.id}`}
                className="mt-8 w-full py-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm text-gray-600 hover:bg-brand-main hover:text-brand-third hover:border-brand-main transition-all flex items-center justify-center gap-2"
              >
                <span>السجل المالي والحضور</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-2xl font-bold text-brand-main">
                   {selectedEmployee ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-xl transition">
                   <X className="w-6 h-6 text-gray-400" />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الاسم الكامل</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                        placeholder="الاسم الثلاثي"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الرقم القومي (14 رقم)</label>
                      <input 
                        type="text" maxLength={14}
                        value={formData.national_id}
                        onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">العنوان</label>
                      <input 
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 1</label>
                      <input 
                        type="text"
                        value={formData.phone_1}
                        onChange={(e) => setFormData({...formData, phone_1: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 2</label>
                      <input 
                        type="text"
                        value={formData.phone_2}
                        onChange={(e) => setFormData({...formData, phone_2: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                       <p className="text-xs font-bold text-brand-main uppercase tracking-widest mb-4">بيانات قريب الطوارئ</p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">اسم القريب</label>
                             <input 
                               type="text"
                               value={formData.relative_name}
                               onChange={(e) => setFormData({...formData, relative_name: e.target.value})}
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم هاتف القريب</label>
                             <input 
                               type="text"
                               value={formData.relative_phone}
                               onChange={(e) => setFormData({...formData, relative_phone: e.target.value})}
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">صلة القرابة</label>
                             <input 
                               type="text"
                               value={formData.relative_relation}
                               onChange={(e) => setFormData({...formData, relative_relation: e.target.value})}
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                               placeholder="أخ، أب، زوجة..."
                             />
                          </div>
                       </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">العمر</label>
                      <input 
                        type="number" required
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الدور الوظيفي</label>
                      <input 
                        type="text" required
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                        placeholder="مثال: نجار، مساعد، دهان"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">أجر الساعة (جنية)</label>
                      <input 
                        type="number" required
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-green-600"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">تاريخ البدء</label>
                      <input 
                        type="date" required
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                </div>

                <button type="submit" className="w-full bg-brand-main text-brand-third font-bold py-5 rounded-2xl shadow-xl shadow-brand-main/20 hover:bg-brand-main/80 transition duration-300">
                   {selectedEmployee ? 'حفظ التعديلات' : 'إتمام التسجيل'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
