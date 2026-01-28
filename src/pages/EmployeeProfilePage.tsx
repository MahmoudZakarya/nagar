import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployees, useAttendance, useLeaves, useDeductions, Leave, Employee, Attendance } from '../hooks/useEmployees';
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
  Hash,
  Coffee,
  CheckCircle,
  TrendingDown
} from 'lucide-react';
import { useQuotations, Quotation } from '../hooks/useQuotations';
import { useAuth } from '../context/AuthContext';
import { Payroll } from '../hooks/useEmployees';
import toast from 'react-hot-toast';

const EmployeeProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { employees, refetch: refetchEmployees } = useEmployees();
  const { history, payroll, loading, fetchHistory, fetchPayroll, checkIn, checkOut, startBreak, endBreak, paySalary, logManualAttendance } = useAttendance();
  const { addLeave, fetchLeaves, leaves } = useLeaves();
  const { addDeduction, fetchDeductions, deductions } = useDeductions();
  const { updateEmployee } = useEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payPeriod, setPayPeriod] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
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

  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isAttendanceEditModalOpen, setIsAttendanceEditModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [attendanceEditForm, setAttendanceEditForm] = useState({
    check_in: '',
    check_out: '',
    unpaid_break_minutes: 0
  });

  const { updateAttendanceRecord } = useAttendance();

  useEffect(() => {
    if (id) {
      const emp = employees.find(e => e.id === parseInt(id));
      if (emp) {
        setEmployee(emp);
        fetchHistory(parseInt(id));
        fetchLeaves(parseInt(id));
        fetchDeductions(parseInt(id));
        fetchPayroll(parseInt(id));
        setEditEmployeeData({
           ...emp,
           start_date: emp.start_date.split('T')[0]
        });
      }
    }
  }, [id, employees]);

  // Calculate total deductions and paid salary
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payroll.reduce((sum, p) => sum + p.amount_paid, 0);

  // Calculate deserved salary (total unpaid attendance) - deductions - already paid
  const totalDeserved = history
    .filter(a => a.check_out) // Only finished shifts
    .reduce((sum, a) => sum + (a.calculated_pay || 0), 0) - totalDeductions - totalPaid;

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
      toast.success('تم تسجيل الحضور يدوياً');
    } catch (error) {
       console.error(error);
       toast.error('فشل في تسجيل الحضور');
    }
  };

  const activeAttendance = history.find(a => a.date === new Date().toISOString().split('T')[0] && !a.check_out);

  const handleCheckIn = async () => {
    if (!id) return;
    try {
      await checkIn(parseInt(id), new Date().toISOString());
      fetchHistory(parseInt(id));
      toast.success('تم تسجيل الحضور بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الحضور');
    }
  };

  const handleStartBreak = async () => {
    if (!activeAttendance) return;
    try {
      await startBreak(activeAttendance.id, new Date().toISOString());
      fetchHistory(Number(id));
      toast.success('بدأت الاستراحة الآن');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleEndBreak = async () => {
    if (!activeAttendance) return;
    try {
      await endBreak(activeAttendance.id, new Date().toISOString());
      fetchHistory(Number(id));
      toast.success('انتهت الاستراحة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleCheckOut = async () => {
    if (!activeAttendance) return;
    try {
      await checkOut(activeAttendance.id, new Date().toISOString(), activeAttendance.unpaid_break_minutes);
      fetchHistory(Number(id));
      toast.success('تم تسجيل الانصراف');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      await paySalary(parseInt(id), parseFloat(payAmount), payPeriod.start, payPeriod.end, user.id);
      fetchPayroll(parseInt(id));
      setShowPayModal(false);
      setPayAmount('');
      toast.success('تم صرف الراتب بنجاح');
    } catch (error) {
      toast.error('فشل في صرف الراتب');
    }
  };

  const handleEditAttendance = (record: Attendance) => {
    setEditingAttendance(record);
    setAttendanceEditForm({
      check_in: record.check_in ? record.check_in.substring(0, 16) : '',
      check_out: record.check_out ? record.check_out.substring(0, 16) : '',
      unpaid_break_minutes: record.unpaid_break_minutes
    });
    setIsAttendanceEditModalOpen(true);
  };

  const onUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance || !id) return;
    try {
      await updateAttendanceRecord(editingAttendance.id, attendanceEditForm);
      fetchHistory(parseInt(id));
      setIsAttendanceEditModalOpen(false);
      toast.success('تم تحديث سجل الحضور');
    } catch (error) {
      toast.error('حدث خطأ أثناء التحديث');
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
              onClick={() => setShowPayModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-600/10 hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
               <DollarSign className="w-5 h-5" />
               صرف راتب
            </button>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 bg-brand-main dark:bg-brand-secondary text-brand-third dark:text-brand-main rounded-2xl font-bold text-sm shadow-lg shadow-brand-main/10 hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
               <Edit className="w-5 h-5" />
               تعديل البيانات
            </button>
            <div className="bg-bg-surface border border-border-theme p-6 rounded-[2rem] shadow-sm flex flex-col items-end">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">المستحقات الحالية</p>
                <p className="text-3xl font-bold italic text-text-primary">{Math.max(0, totalDeserved).toLocaleString()} <span className="text-xs font-normal">جنية</span></p>
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
               {activeAttendance ? (
                 <div className="flex gap-4 w-full">
                   {!activeAttendance.current_break_start ? (
                     <button 
                      onClick={handleStartBreak}
                      className="flex-1 bg-bg-surface border border-border-theme p-6 rounded-[2rem] shadow-sm hover:bg-bg-primary transition flex flex-col items-center justify-center gap-3 font-bold group cursor-pointer"
                     >
                        <div className="p-4 bg-orange-100 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Coffee className="w-8 h-8" />
                        </div>
                        <span className="text-lg">بدء استراحة</span>
                     </button>
                   ) : (
                     <button 
                      onClick={handleEndBreak}
                      className="flex-1 bg-orange-500 text-white p-6 rounded-[2rem] shadow-lg shadow-orange-500/20 transition flex flex-col items-center justify-center gap-3 font-bold cursor-pointer"
                     >
                        <Play className="w-8 h-8 animate-pulse" />
                        <span className="text-lg">العودة من الاستراحة</span>
                     </button>
                   )}
                   <button 
                    onClick={handleCheckOut}
                    className="flex-1 bg-bg-surface border border-border-theme p-6 rounded-[2rem] shadow-sm hover:bg-red-500 hover:text-white transition group flex flex-col items-center justify-center gap-3 font-bold cursor-pointer"
                   >
                      <div className="p-4 bg-red-100 rounded-2xl group-hover:bg-red-400 group-hover:text-white transition-colors">
                        <Square className="w-8 h-8" />
                      </div>
                      <span className="text-lg">تسجيل انصراف</span>
                   </button>
                 </div>
               ) : (
                 <button 
                  onClick={handleCheckIn}
                  className="w-full bg-brand-main dark:bg-brand-secondary text-brand-third dark:text-brand-main p-8 rounded-[2.5rem] shadow-xl shadow-brand-main/20 hover:opacity-90 transition flex items-center justify-center gap-5 cursor-pointer font-black text-2xl"
                 >
                    <CheckCircle className="w-10 h-10" />
                    تسجيل حضور الموظف الآن
                 </button>
               )}

               <div className="flex gap-4 w-full mt-4">
                  <button 
                    onClick={() => setShowManualModal(true)}
                    className="flex-1 bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center justify-center gap-3 font-bold text-xs text-text-secondary cursor-pointer"
                  >
                      <Plus className="w-4 h-4 text-blue-500" />
                      تسجيل يدوي
                  </button>
                  <button 
                    onClick={() => setShowDeductionModal(true)}
                    className="flex-1 bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center justify-center gap-3 font-bold text-xs text-text-secondary cursor-pointer"
                  >
                      <MinusCircle className="w-4 h-4 text-red-500" />
                      خصم / جزاء
                  </button>
                  <button 
                    onClick={() => setShowLeaveModal(true)}
                    className="flex-1 bg-bg-surface border border-border-theme p-4 rounded-2xl shadow-sm hover:bg-bg-primary transition flex items-center justify-center gap-3 font-bold text-xs text-text-secondary cursor-pointer"
                  >
                      <Umbrella className="w-4 h-4 text-orange-500" />
                      إجازة
                  </button>
               </div>
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
                             <td className="p-6 text-left font-bold text-green-600 italic font-mono flex items-center justify-end gap-3">
                                {a.calculated_pay?.toLocaleString() || '0'} جنية
                                {user?.role === 'admin' && (
                                   <button 
                                    onClick={() => handleEditAttendance(a)}
                                    className="p-2 hover:bg-bg-primary rounded-lg transition text-text-muted hover:text-brand-main cursor-pointer"
                                   >
                                      <Edit className="w-4 h-4" />
                                   </button>
                                )}
                             </td>
                          </tr>
                       ))}
                       {history.length === 0 && (
                          <tr><td colSpan={5} className="p-20 text-center text-text-muted italic">لا توجد سجلات بعد</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Payment History */}
           <div className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-border-theme overflow-hidden">
              <div className="p-8 border-b border-border-theme bg-bg-primary/20 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                    سجل صرف الرواتب
                 </h2>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <thead>
                       <tr className="bg-bg-primary/50">
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">التاريخ</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">الفترة</th>
                          <th className="p-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-left">المبلغ المنصرف</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme">
                       {payroll.map((p) => (
                          <tr key={p.id} className="hover:bg-bg-primary/30 transition">
                             <td className="p-6 text-center font-bold text-text-secondary">{new Date(p.payment_date).toLocaleDateString('ar-EG')}</td>
                             <td className="p-6 text-center font-medium text-text-muted text-xs">
                                {new Date(p.period_start).toLocaleDateString('ar-EG')} - {new Date(p.period_end).toLocaleDateString('ar-EG')}
                             </td>
                             <td className="p-6 text-left font-bold text-brand-main italic">{p.amount_paid.toLocaleString()} جنية</td>
                          </tr>
                       ))}
                       {payroll.length === 0 && (
                          <tr><td colSpan={3} className="p-20 text-center text-text-muted italic">لا توجد دفعات منصرفة بعد</td></tr>
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
               toast.success('تم تحديث بيانات الموظف');
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
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold cursor-pointer"
                      >
                         <option value="Active">نشط</option>
                         <option value="Inactive">غير نشط</option>
                         <option value="On Leave">في إجازة</option>
                      </select>
                   </div>
                   
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">العنوان</label>
                      <input 
                        type="text" 
                        value={editEmployeeData.address}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, address: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 1</label>
                      <input 
                        type="text" 
                        value={editEmployeeData.phone_1}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, phone_1: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 2</label>
                      <input 
                        type="text" 
                        value={editEmployeeData.phone_2}
                        onChange={(e) => setEditEmployeeData({...editEmployeeData, phone_2: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>

                   <div className="col-span-2 border-t border-gray-100 pt-6 mt-4">
                       <p className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">بيانات قريب الطوارئ</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="col-span-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">اسم القريب</label>
                             <input 
                               type="text"
                               value={editEmployeeData.relative_name}
                               onChange={(e) => setEditEmployeeData({...editEmployeeData, relative_name: e.target.value})}
                               className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم هاتف القريب</label>
                             <input 
                               type="text"
                               value={editEmployeeData.relative_phone}
                               onChange={(e) => setEditEmployeeData({...editEmployeeData, relative_phone: e.target.value})}
                               className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">صلة القرابة</label>
                             <input 
                               type="text"
                               value={editEmployeeData.relative_relation}
                               onChange={(e) => setEditEmployeeData({...editEmployeeData, relative_relation: e.target.value})}
                               className="w-full px-4 py-3 bg-bg-primary border-none rounded-xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                             />
                          </div>
                       </div>
                   </div>
                </div>

                <button type="submit" className="w-full bg-[#854836] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#854836]/20 hover:bg-[#703a2a] transition duration-300 cursor-pointer">
                   حفظ التعديلات
                </button>
             </form>
          </div>
        </div>
      )}
      {/* Salary Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPayModal(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-green-600">صرف راتب موظف</h2>
                <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-bg-primary rounded-xl transition cursor-pointer">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={handlePaySalary} className="p-8 space-y-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex justify-between items-center">
                   <div>
                      <p className="text-xs font-bold text-blue-400 uppercase mb-1">المستحقات الحالية</p>
                      <p className="text-2xl font-black text-blue-700">{totalDeserved.toLocaleString()} ج.م</p>
                   </div>
                   <button 
                    type="button" 
                    onClick={() => setPayAmount(totalDeserved.toString())}
                    className="text-xs font-black bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition cursor-pointer"
                   >
                     سحب الكل
                   </button>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">المبلغ المراد صرفه</label>
                   <input 
                     type="number" required
                     value={payAmount}
                     onChange={(e) => setPayAmount(e.target.value)}
                     className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-green-500/10 outline-none font-bold text-green-600 text-xl"
                     placeholder="0.00"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">من تاريخ</label>
                      <input 
                        type="date" required
                        value={payPeriod.start}
                        onChange={(e) => setPayPeriod({...payPeriod, start: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">إلى تاريخ</label>
                      <input 
                        type="date" required
                        value={payPeriod.end}
                        onChange={(e) => setPayPeriod({...payPeriod, end: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary border-none rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold"
                      />
                   </div>
                </div>

                <button type="submit" className="w-full bg-green-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-green-200 hover:bg-green-700 transition duration-300 cursor-pointer">
                   تأكيد عملية الصرف والخصم من الخزنة
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Attendance Edit Modal (Admin Only) */}
      {isAttendanceEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAttendanceEditModalOpen(false)}></div>
          <div className="bg-bg-surface border border-border-theme w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-border-theme flex justify-between items-center bg-bg-primary/50">
                <h2 className="text-2xl font-bold text-text-primary">تعديل سجل الحضور</h2>
                <button onClick={() => setIsAttendanceEditModalOpen(false)} className="p-2 hover:bg-bg-primary rounded-xl transition cursor-pointer">
                   <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>
             
             <form onSubmit={onUpdateAttendance} className="p-8 space-y-6">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">وقت الحضور</label>
                   <input 
                     type="datetime-local" step="60" required
                     value={attendanceEditForm.check_in}
                     onChange={(e) => setAttendanceEditForm({...attendanceEditForm, check_in: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">وقت الانصراف</label>
                   <input 
                     type="datetime-local" step="60" required
                     value={attendanceEditForm.check_out}
                     onChange={(e) => setAttendanceEditForm({...attendanceEditForm, check_out: e.target.value})}
                     className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">دقائق الاستراحة</label>
                   <input 
                     type="number" required
                     value={attendanceEditForm.unpaid_break_minutes}
                     onChange={(e) => setAttendanceEditForm({...attendanceEditForm, unpaid_break_minutes: parseInt(e.target.value)})}
                     className="w-full px-6 py-4 bg-bg-primary border border-border-theme/50 rounded-2xl focus:ring-2 focus:ring-brand-main/10 outline-none font-bold text-text-primary"
                   />
                </div>

                <button type="submit" className="w-full bg-brand-main dark:bg-brand-secondary text-brand-third dark:text-brand-main font-bold py-5 rounded-2xl shadow-xl shadow-brand-main/20 hover:opacity-90 transition duration-300 cursor-pointer">
                   حفظ التعديلات وإعادة الحساب
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfilePage;
