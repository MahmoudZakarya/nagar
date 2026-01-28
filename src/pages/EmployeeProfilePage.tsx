import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployees, useAttendance, useLeaves, useDeductions, Leave, Employee } from '../hooks/useEmployees';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  DollarSign, 
  Briefcase, 
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Square,
  History,
  MinusCircle,
  Umbrella,
  Heart,
  Save,
  X,
  Edit,
  Phone,
  MapPin,
  Hash
} from 'lucide-react';

const EmployeeProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, refetch: refetchEmployees } = useEmployees();
  const { history, loading, fetchHistory, checkIn, checkOut, paySalary, logManualAttendance } = useAttendance();
  const { addLeave, fetchLeaves, leaves } = useLeaves();
  const { addDeduction, fetchDeductions, deductions } = useDeductions();
  const { updateEmployee } = useEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Manual Attendance State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00',
    check_out_time: '17:00',
    break_minutes: 60
  });

  const [leaveData, setLeaveData] = useState<{
    type: Leave['type'];
    start_date: string;
    end_date: string;
    is_paid: boolean;
  }>({
    type: 'Sick',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_paid: false
  });

  const [deductionData, setDeductionData] = useState({
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editEmployeeData, setEditEmployeeData] = useState<any>(null); // Keeping any for now because of potential extra fields or form handling nuances, but will ensure safety at call site

  // Payroll/Deduction/Leave Modals
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (id) {
      const emp = employees.find(e => e.id === parseInt(id));
      if (emp) {
        setEmployee(emp);
        fetchHistory(parseInt(id));
        fetchLeaves(parseInt(id));
        fetchDeductions(parseInt(id));
        setEditEmployeeData({
           ...emp,
           start_date: emp.start_date.split('T')[0]
        });
      }
    }
  }, [id, employees]);

  // Calculate total deductions
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  // Calculate deserved salary (total unpaid attendance) - deductions
  const totalDeserved = history
    .filter(a => a.check_out) // Only finished shifts
    .reduce((sum, a) => sum + (a.calculated_pay || 0), 0) - totalDeductions;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    // Combine date and time
    const checkInDateTime = `${manualData.date}T${manualData.check_in_time}:00`;
    const checkOutDateTime = `${manualData.date}T${manualData.check_out_time}:00`;

    try {
      await logManualAttendance({
        employee_id: parseInt(id),
        date: manualData.date,
        check_in: checkInDateTime,
        check_out: checkOutDateTime,
        unpaid_break_minutes: manualData.break_minutes
      });
      fetchHistory(parseInt(id));
      setShowManualModal(false);
    } catch (error) {
       console.error(error);
    }
  };

  if (!employee) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-brand-main/20 border-t-brand-main rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/employees')}
              className="p-3 bg-bg-surface rounded-2xl shadow-sm border border-border-theme hover:bg-bg-primary transition"
            >
              <ArrowRight className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{employee.name}</h1>
              <p className="text-text-muted font-bold">{employee.role}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 bg-brand-main dark:bg-brand-secondary text-brand-third dark:text-brand-main rounded-2xl font-bold text-sm shadow-lg shadow-brand-main/10 hover:opacity-90 transition flex items-center gap-2"
            >
               <Edit className="w-5 h-5" />
               تعديل البيانات
            </button>
            <div className="bg-bg-surface border border-border-theme p-6 rounded-[2rem] shadow-sm flex flex-col items-end">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">المستحقات الحالية</p>
                <p className="text-3xl font-bold italic text-text-primary">{totalDeserved.toLocaleString()} <span className="text-xs font-normal">جنية</span></p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details Sidebar */}
        <div className="space-y-6">
            <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme">
               <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 bg-brand-main rounded-[2rem] flex items-center justify-center text-brand-third text-4xl font-bold shadow-xl shadow-brand-main/20 mb-4">
                    {employee.name.charAt(0)}
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${
                    employee.status === 'Active' ? 'bg-green-100/10 text-green-500' : 'bg-bg-primary text-text-muted'
                  }`}>
                    {employee.status === 'Active' ? 'نشط' : 'غير نشط'}
                  </span>
               </div>

               <div className="space-y-4">
                  <div className="p-4 bg-bg-primary border border-border-theme/30 rounded-2xl">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">الرقم القومي</p>
                     <p className="font-bold text-text-primary flex items-center gap-2">
                        <Hash className="w-4 h-4 text-text-muted" />
                        {employee.national_id || 'غير مسجل'}
                     </p>
                  </div>
                  <div className="p-4 bg-bg-primary border border-border-theme/30 rounded-2xl">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">العنوان</p>
                     <p className="font-bold text-text-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-text-muted" />
                        {employee.address || 'غير مسجل'}
                     </p>
                  </div>
                  <div className="p-4 bg-bg-primary border border-border-theme/30 rounded-2xl">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">أرقام التواصل</p>
                     <p className="font-bold text-text-primary flex items-center gap-2">
                        <Phone className="w-4 h-4 text-text-muted" />
                        {employee.phone_1} {employee.phone_2 ? `/ ${employee.phone_2}` : ''}
                     </p>
                  </div>
               </div>
            </div>

            {/* Relative Info */}
            <div className="bg-bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border-theme">
                <h3 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    بيان قريب الطوارئ
                </h3>
                <div className="space-y-3">
                    <p className="text-text-primary font-bold">{employee.relative_name || '---'}</p>
                    <p className="text-xs text-text-muted font-medium">الصلة: {employee.relative_relation || '---'}</p>
                    <p className="text-sm font-bold text-brand-main dark:text-brand-secondary">{employee.relative_phone || '---'}</p>
                </div>
            </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
           {/* Actions Toolbar */}
           <div className="flex flex-wrap gap-4">
               <button 
                onClick={() => setShowManualModal(true)}
                className="bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center gap-3 font-bold text-sm text-text-secondary"
               >
                  <Plus className="w-5 h-5 text-blue-500" />
                  تسجيل حضور يدوي
               </button>
               <button 
                onClick={() => setShowDeductionModal(true)}
                className="bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center gap-3 font-bold text-sm text-text-secondary"
               >
                  <MinusCircle className="w-5 h-5 text-red-500" />
                  إضافة خصم / جزاء
               </button>
               <button 
                onClick={() => setShowLeaveModal(true)}
                className="bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center gap-3 font-bold text-sm text-text-secondary"
               >
                  <Umbrella className="w-5 h-5 text-orange-500" />
                  تسجيل إجازة
               </button>
           </div>

           {/* Attendance History */}
           <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden">
              <div className="p-8 border-b border-border-theme bg-bg-primary/20 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                    <History className="w-6 h-6 text-brand-main" />
                    سجل الحضور والغياب
                 </h2>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <thead>
                       <tr className="bg-bg-primary/50">
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">التاريخ</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">الدخول</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">الانصراف</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">ساعات</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-left">الأجر</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme">
                       {history.map((a) => (
                          <tr key={a.id} className="hover:bg-bg-primary/30 transition">
                             <td className="p-6 text-center font-bold text-text-secondary">{new Date(a.date).toLocaleDateString('ar-EG')}</td>
                             <td className="p-6 text-center font-medium text-text-muted">{a.check_in ? new Date(a.check_in).toLocaleTimeString('ar-EG') : '---'}</td>
                             <td className="p-6 text-center font-medium text-text-muted">{a.check_out ? new Date(a.check_out).toLocaleTimeString('ar-EG') : '---'}</td>
                             <td className="p-6 text-center font-bold text-text-primary">{a.total_hours?.toFixed(1) || '0'} س</td>
                             <td className="p-6 text-left font-bold text-green-600 italic font-mono">{a.calculated_pay?.toLocaleString() || '0'} جنية</td>
                          </tr>
                       ))}
                       {history.length === 0 && (
                          <tr><td colSpan={5} className="p-20 text-center text-text-muted italic">لا توجد سجلات بعد</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowManualModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تسجيل حضور يدوي</h2>
                <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-bg-primary rounded-xl transition">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={handleManualSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">تاريخ اليوم</label>
                  <input 
                    type="date" required
                    value={manualData.date}
                    onChange={(e) => setManualData({...manualData, date: e.target.value})}
                    className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">وقت الحضور</label>
                    <input 
                      type="time" required
                      value={manualData.check_in_time}
                      onChange={(e) => setManualData({...manualData, check_in_time: e.target.value})}
                      className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">وقت الانصراف</label>
                    <input 
                      type="time" required
                      value={manualData.check_out_time}
                      onChange={(e) => setManualData({...manualData, check_out_time: e.target.value})}
                      className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">مدة الاستراحة (دقائق)</label>
                  <input 
                    type="number" required
                    value={manualData.break_minutes}
                    onChange={(e) => setManualData({...manualData, break_minutes: parseInt(e.target.value)})}
                    className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                  />
                </div>

                <button type="submit" className="w-full bg-[#854836] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#854836]/20 hover:bg-[#703a2a] transition duration-300">
                   حفظ السجل اليدوي
                </button>
             </form>
          </div>
        </div>
      )}
      
      {/* Deduction Modal */}
      {showDeductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeductionModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-red-500">إضافة خصم / جزاء</h2>
                <button onClick={() => setShowDeductionModal(false)} className="p-2 hover:bg-bg-primary rounded-xl transition">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={async (e) => {
               e.preventDefault();
                               if (employee) {
                  await addDeduction({ ...deductionData, employee_id: employee.id, amount: parseFloat(deductionData.amount) });
                                 fetchDeductions(employee.id);
                }
               setShowDeductionModal(false);
             }} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">المبلغ</label>
                  <input 
                    type="number" required
                    value={deductionData.amount}
                    onChange={(e) => setDeductionData({...deductionData, amount: e.target.value})}
                    className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-red-500/10 outline-none font-bold text-red-600"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">السبب</label>
                  <textarea 
                    rows={3} required
                    value={deductionData.reason}
                    onChange={(e) => setDeductionData({...deductionData, reason: e.target.value})}
                    className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold resize-none"
                    placeholder="مثال: غياب، إتلاف أدوات..."
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">التاريخ</label>
                   <input 
                     type="date" required
                     value={deductionData.date}
                     onChange={(e) => setDeductionData({...deductionData, date: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-primary  border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                   />
                </div>

                <button type="submit" className="w-full bg-red-600 text-white font-bold py-5 rounded-2xl dark:shadow-none shadow-xl shadow-red-200 hover:bg-red-700 transition duration-300">
                   تأكيد الخصم
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-orange-500">تسجيل إجازة</h2>
                <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-bg-primary rounded-xl transition">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={async (e) => {
               e.preventDefault();
                               if (employee) {
                  await addLeave({ ...leaveData, employee_id: employee.id });
                                 fetchLeaves(employee.id);
                }
               setShowLeaveModal(false);
             }} className="p-8 space-y-6">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">نوع الإجازة</label>
                   <select 
                     value={leaveData.type}
                     onChange={(e) => setLeaveData({...leaveData, type: e.target.value as Leave['type']})}
                     className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-orange-500/10 outline-none font-bold"
                   >
                     <option value="Sick">مرضي</option>
                     <option value="Vacation">اعتيادي</option>
                     <option value="Weekend">عطلة أسبوعية</option>
                     <option value="Unpaid">بدون أجر</option>
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">تاريخ البدء</label>
                      <input 
                        type="date" required
                        value={leaveData.start_date}
                        onChange={(e) => setLeaveData({...leaveData, start_date: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-orange-500/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">تاريخ الانتهاء</label>
                      <input 
                        type="date" required
                        value={leaveData.end_date}
                        onChange={(e) => setLeaveData({...leaveData, end_date: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-orange-500/10 outline-none font-bold"
                      />
                   </div>
                </div>
                <div className="flex items-center gap-3 px-1">
                   <input 
                     type="checkbox" 
                     id="is_paid"
                     checked={leaveData.is_paid}
                     onChange={(e) => setLeaveData({...leaveData, is_paid: e.target.checked})}
                     className="w-5 h-5 rounded bg-bg-primary text-orange-600 focus:ring-orange-500"
                   />
                   <label htmlFor="is_paid" className="font-bold text-text-primary">إجازة مدفوعة الأجر</label>
                </div>

                <button type="submit" className="w-full bg-orange-600 text-white font-bold py-5 rounded-2xl dark:shadow-none shadow-xl shadow-orange-200 hover:bg-orange-700 transition duration-300">
                   حفظ الإجازة
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تعديل بيانات الموظف</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-bg-primary rounded-xl transition">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (employee) {
                  await updateEmployee(employee.id, {
                    ...editEmployeeData,
                    age: parseInt(editEmployeeData.age),
                    hourly_rate: parseFloat(editEmployeeData.hourly_rate)
                  });
                }
               refetchEmployees();
               setIsEditModalOpen(false);
             }} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الاسم الكامل</label>
                      <input 
                        type="text" required
                        value={editEmployeeData.name}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الرقم القومي</label>
                      <input 
                        type="text" maxLength={14}
                        value={editEmployeeData.national_id}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, national_id: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الدور الوظيفي</label>
                      <input 
                        type="text" required
                        value={editEmployeeData.role}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, role: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">أجر الساعة</label>
                      <input 
                        type="number" required
                        value={editEmployeeData.hourly_rate}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, hourly_rate: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">الحالة</label>
                      <select 
                        value={editEmployeeData.status}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, status: e.target.value as any})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      >
                         <option value="Active">نشط</option>
                         <option value="Inactive">غير نشط</option>
                         <option value="On Leave">في إجازة</option>
                      </select>
                   </div>
                </div>

                <button type="submit" className="w-full bg-[#854836] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#854836]/20 hover:bg-[#703a2a] transition duration-300">
                   حفظ التعديلات
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfilePage;
