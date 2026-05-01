import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, Payment } from '../hooks/useTask';
import { useTasks } from '../hooks/useTasks';
import API_URL from '../config/api';

import logo from '../assets/nagar-logo-removebg.png';
import whatsapp from '../assets/whatsapp.svg';
import { Printer, ArrowRight, Save, Phone, Calendar, User, FileText, CheckCircle2, ChevronDown, Check, Plus } from 'lucide-react';


import { formatDate } from '../utils/dateUtils';
import { useQuotations, Quotation } from '../hooks/useQuotations';


const EGP = () => <span className="text-[0.7em] font-normal mr-1">جنية</span>;

const TaskInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { task: mainTask, payments: mainPayments, loading } = useTask(id);
  const { tasks: allTasks } = useTasks();
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showQuotationPicker, setShowQuotationPicker] = useState(false);
  const { getQuotationsByClient } = useQuotations();
  const [clientQuotations, setClientQuotations] = useState<Quotation[]>([]);
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      setSelectedTaskIds([Number(id)]);
    }
  }, [id]);

  useEffect(() => {
    if (mainTask?.client_id) {
      getQuotationsByClient(mainTask.client_id).then(setClientQuotations);
    }
  }, [mainTask?.client_id, getQuotationsByClient]);

  useEffect(() => {
    const fetchAllPayments = async () => {
      if (selectedTaskIds.length === 0) return;
      
      try {
        const paymentPromises = selectedTaskIds.map(tid => 
          fetch(`${API_URL}/api/tasks/${tid}/payments`).then(res => res.json())
        );
        const results = await Promise.all(paymentPromises);
        const merged = results.flat().sort((a, b) => 
          new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
        );
        setAllPayments(merged);
      } catch (err) {
        console.error("Failed to fetch aggregated payments:", err);
      }
    };

    fetchAllPayments();
  }, [selectedTaskIds]);

  const toggleTask = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? (prev.length > 1 ? prev.filter(id => id !== taskId) : prev) 
        : [...prev, taskId]
    );
  };

  const toggleQuotation = (quotationId: number) => {
    setSelectedQuotationIds(prev =>
      prev.includes(quotationId)
        ? prev.filter(id => id !== quotationId)
        : [...prev, quotationId]
    );
  };

  const clientTasks = allTasks.filter(t => t.client_id === mainTask?.client_id);
  const selectedTasks = allTasks.filter(t => selectedTaskIds.includes(t.id));
  
  // Sort selected tasks by registration date
  selectedTasks.sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());

  const selectedQuotations = clientQuotations.filter(q => selectedQuotationIds.includes(q.id));
  const mergedQuotationItems = selectedQuotations.flatMap(q => q.items || []);
  const quotationsTotal = selectedQuotations.reduce((sum, q) => sum + (q.total_amount - (q.discount || 0)), 0);

  const handleSavePDF = async () => {
    if (!window.electronAPI) {
      alert("هذه الميزة متاحة فقط في تطبيق النجار");
      return;
    }

    setIsExporting(true);
    try {
      const result = await window.electronAPI.savePDF();
      if (result.success) {
        alert(`تم حفظ الملف بنجاح: ${result.filePath}`);
      } else if (result.error) {
        alert(`حدث خطأ أثناء الحفظ: ${result.error}`);
      }
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("حدث خطأ غير متوقع أثناء تصدير PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">جاري التحميل...</div>;
  if (!mainTask) return <div className="p-20 text-center text-red-500 font-bold">عذراً، لم يتم العثور على المشروع</div>;

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalAgreed = selectedQuotationIds.length > 0 
    ? quotationsTotal 
    : selectedTasks.reduce((sum, t) => sum + (t.total_agreed_price || 0) + (t.extra_costs || 0), 0);
  const remaining = totalAgreed - totalPaid;

  return (
    <div className="bg-bg-primary min-h-screen p-2 text-right print:p-0 transition-colors duration-300" dir="rtl">
      {/* Action Bar - Hidden in Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>
        <div className="flex gap-4 items-center">
          {clientTasks.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-lg hover:bg-brand-secondary/20 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مشاريع أخرى لهذا العميل ({selectedTaskIds.length})</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showTaskPicker && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-bg-surface border border-border-theme rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <p className="p-2 text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border-theme mb-1">مشاريع العميل</p>
                  <div className="max-h-64 overflow-y-auto">
                    {clientTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleTask(t.id)}
                        className={`w-full text-right p-3 rounded-lg flex items-center justify-between transition-colors group ${selectedTaskIds.includes(t.id) ? 'bg-brand-main text-white' : 'hover:bg-bg-primary text-text-primary'}`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm">{t.title}</p>
                          <p className={`text-[10px] ${selectedTaskIds.includes(t.id) ? 'text-white/70' : 'text-text-muted'}`}>{formatDate(t.registered_at)}</p>
                        </div>
                        {selectedTaskIds.includes(t.id) && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {clientQuotations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQuotationPicker(!showQuotationPicker)}
                className="flex items-center gap-2 px-4 py-2 bg-text-primary/10 text-text-primary border border-text-primary/20 rounded-lg hover:bg-text-primary/20 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عروض أسعار ({selectedQuotationIds.length})</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showQuotationPicker && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-bg-surface border border-border-theme rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <p className="p-2 text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border-theme mb-1">عروض سعر العميل</p>
                  <div className="max-h-64 overflow-y-auto">
                    {clientQuotations.map(q => (
                      <button
                        key={q.id}
                        onClick={() => toggleQuotation(q.id)}
                        className={`w-full text-right p-3 rounded-lg flex items-center justify-between transition-colors group ${selectedQuotationIds.includes(q.id) ? 'bg-text-primary text-bg-surface' : 'hover:bg-bg-primary text-text-primary'}`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm">{q.quotation_number}</p>
                          <p className={`text-[10px] ${selectedQuotationIds.includes(q.id) ? 'text-bg-surface/70' : 'text-text-muted'}`}>{formatDate(q.created_at)}</p>
                        </div>
                        {selectedQuotationIds.includes(q.id) && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSavePDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 bg-bg-surface border border-border-theme rounded-lg hover:bg-bg-primary font-bold text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-text-muted/20 border-t-text-muted rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>حفظ كـ PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2 bg-text-primary text-bg-surface rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* A4 Container */}
      <div id="invoice-container" className="bg-bg-surface mx-auto flex flex-col relative print:w-full print:max-w-none print:m-0 min-h-[290mm] shadow-xl border border-border-theme transition-colors duration-300">
        
        {/* Header */}
        <div className="relative bg-bg-primary border-b-8 border-text-primary px-12 pt-8 pb-5 print:px-8 flex justify-between items-center overflow-hidden">
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-text-primary rounded-2xl">
                    <FileText className="w-8 h-8 text-bg-surface" />
                </div>
                <div>
                   <h1 className="text-4xl mb-4 font-bold text-text-primary">فاتورة مدفوعات</h1>
                   <p className="text-sm font-bold text-text-secondary tracking-[0.2em] uppercase">Payment Receipt / Invoice</p>
                </div>
             </div>
             
             <div className="space-y-2 mt-4">
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest min-w-[80px]">رقم الفاتورة:</span>
                    <span className="text-lg font-black text-text-primary font-mono bg-bg-surface px-3 py-1 rounded-lg border border-border-theme">
                        {selectedTaskIds.length === 1 ? `#${mainTask.id}` : `MULT-${mainTask.id}`}
                    </span>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest min-w-[80px]">عرض السعر:</span>
                    <span className="flex-1 min-h-[2.5rem] bg-bg-surface px-3 py-2 rounded-lg border border-border-theme text-sm font-bold text-text-primary flex flex-wrap gap-1">
                        {selectedQuotations.length > 0 
                          ? selectedQuotations.map(q => q.quotation_number).join(' / ')
                          : '-'
                        }
                    </span>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest min-w-[80px]">التاريخ:</span>
                    <span className="text-lg font-bold text-text-primary">{formatDate(new Date())}</span>
                </div>
             </div>
           </div>

           <div className="relative z-10 flex flex-col items-end text-left">
             <img src={logo} alt="Nagar Logic" className="h-24 object-contain mb-2 bg-black print:bg-black border rounded-xl p-2 border-transparent" />
             <div className="text-sm space-y-1 text-text-primary font-bold" dir="ltr">
                <p className="text-text-primary text-xl font-bold">محمد بيومي</p>
                    <div className="flex gap-2">
                <Phone className="w-4 h-4 text-brand-secondary"/>
                <p>01117260406</p>
                </div>
                <div className="flex gap-2">
                <img src={whatsapp} alt="" className="w-4 h-4" />
                <p>01062077898</p>
                </div>
                <p>المحمودية، البحيرة</p>
             </div>
           </div>
        </div>

        {/* Client & Task Info */}
        <div className="px-12 py-5 print:px-8 grid grid-cols-2 gap-5">
          <div className="space-y-2">
             <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    العميل الموجه إليه
                </h3>
                <div className="bg-bg-primary/50 py-4 px-6 rounded-3xl border border-border-theme">
                    <p className="text-xl font-bold text-text-primary mb-1">{mainTask.client_name}</p>
                    <p className="text-text-secondary h-6 font-bold" dir="ltr">{mainTask.phone_1}</p>
                </div>
             </div>
          </div>

          <div className="space-y-2">
             <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    عنوان المشروع
                </h3>
                <div className="space-y-4">
                    {selectedTasks.map(t => (
                       <div key={t.id} className="bg-bg-primary/50 py-4 px-6 rounded-3xl border border-border-theme">
                           <p className="text-xl font-bold text-text-primary mb-1">{t.title}</p>
                           <div className="flex flex-wrap gap-x-4 text-[10px] font-bold text-text-secondary">
                               <span>طلب في: {formatDate(t.registered_at)}</span>
                               {t.delivery_due_date && <span className="text-orange-600">تسليم متوقع: {formatDate(t.delivery_due_date)}</span>}
                           </div>
                       </div>
                    ))}
                </div>
             </div>
          </div>
          
          <div className="col-span-2">
             <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                {selectedQuotationIds.length > 0 ? <Plus className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {selectedQuotationIds.length > 0 ? 'تفاصيل عروض السعر' : 'وصف العمل'}
             </h3>
             
             {selectedQuotationIds.length > 0 ? (
               <div className="bg-bg-primary/20 rounded-3xl border border-border-theme overflow-hidden">
                 <table className="w-full border-collapse table-fixed">
                   <thead>
                     <tr className="bg-bg-primary text-text-primary text-[10px] font-bold uppercase tracking-widest border-b border-border-theme">
                       <th className="py-2 px-4 text-right w-[5%]">#</th>
                       <th className="py-2 px-4 text-right w-[10%]">صورة</th>
                       <th className="py-2 px-4 text-right w-[35%]">البند</th>
                       <th className="py-2 px-4 text-center w-[10%]">الكمية</th>
                       <th className="py-2 px-4 text-center w-[15%]">سعر المتر</th>
                       <th className="py-2 px-4 text-center w-[15%]">سعر الوحدة</th>
                       <th className="py-2 px-4 text-left w-[23%]">الإجمالي</th>
                     </tr>
                   </thead>
                   <tbody>
                     {mergedQuotationItems.map((item, idx) => (
                       <tr key={idx} className="border-b border-border-theme/50 last:border-0 hover:bg-bg-primary/30 transition-colors">
                         <td className="py-2 px-4 text-center text-[10px] font-bold text-text-muted">{idx + 1}</td>
                         <td className="py-2 px-4">
                           {item.image_path && (
                             <img 
                               src={`${API_URL}${item.image_path}`} 
                               alt="" 
                               className="w-12 h-12 object-contain rounded-lg border border-border-theme bg-white"
                             />
                           )}
                         </td>
                         <td className="py-2 px-4">
                           <p className="font-bold text-sm text-text-primary break-words">
                             {item.item_name}
                           </p>
                           {item.description && (
                             <p className="text-[10px] text-text-secondary whitespace-normal break-words mt-1 leading-tight">
                               {item.description}
                             </p>
                           )}
                         </td>
                         <td className="py-2 px-4 text-center text-sm font-bold text-text-primary">{item.quantity}</td>
                         <td className="py-2 px-4 text-center text-sm font-mono text-text-secondary">
                           {item.meter_price > 0 ? item.meter_price.toLocaleString() : '-'}
                         </td>
                         <td className="py-2 px-4 text-center text-sm font-mono text-text-secondary">
                           {item.unit_price > 0 ? item.unit_price.toLocaleString() : '-'}
                         </td>
                         <td className="py-2 px-4 text-left font-black text-text-primary text-sm">
                           {item.row_total.toLocaleString()}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="bg-bg-primary/30 py-4 px-6 rounded-3xl border border-border-theme italic text-text-primary leading-relaxed font-medium">
                  {selectedTasks.length === 1 
                    ? (mainTask.description || 'لم يتم تحديد وصف دقيق للمشروع.')
                    : `تجميع لفاتورة عدة مشاريع للعميل: ${selectedTasks.map(t => t.title).join(' | ')}`
                  }
               </div>
             )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="px-12 flex-1 print:px-8 mb-2">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            سجل الدفعات المؤكدة
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-bg-primary text-text-primary">
                <th className="py-2 px-6 text-right rounded-tr-xl font-bold text-[12px] uppercase tracking-widest w-[10%]">#</th>
                <th className="py-2 px-6 text-right font-bold text-[12px] uppercase tracking-widest">تاريخ الدفعة</th>
                <th className="py-2 px-6 text-right font-bold text-[12px] uppercase tracking-widest w-auto">ملاحظة</th>
                <th className="py-2 px-6 text-left rounded-tl-xl font-bold text-[12px] uppercase tracking-widest w-[25%]">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((p, index) => (
                <tr key={p.id} className="bg-bg-primary/20 hover:bg-bg-primary/40 transition-colors">
                  <td className="py-2 px-6 font-bold text-text-muted text-center border-b border-border-theme/50">{index + 1}</td>
                  <td className="py-2 px-6 font-bold text-text-primary border-b border-border-theme/50">{formatDate(p.payment_date)}</td>
                  <td className="py-2 px-6 text-text-primary font-medium border-b border-border-theme/50">
                    {p.note || '-'} {selectedTaskIds.length > 1 && <span className="text-[10px] bg-bg-surface px-1.5 py-0.5 rounded border border-border-theme mr-1">T#{p.task_id}</span>}
                  </td>
                  <td className="py-2 px-6 text-left font-black text-text-primary border-b border-border-theme/50 min-w-[120px]">
                    {p.amount.toLocaleString()} <EGP />
                  </td>
                </tr>
              ))}
              {allPayments.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-12 text-center text-text-muted italic border-b border-border-theme/50">لا يوجد سجل مدفوعات مسجل بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        <div className="mt-auto px-12 py-12 print:px-8 flex justify-between items-end ">
           <div className="text-text-muted text-xs font-bold leading-relaxed max-w-sm">
              <p>ملاحظة: تعتبر هذه الفاتورة إثباتاً رسمياً للمدفوعات الموضحة أعلاه فقط. المبالغ المتبقية تخضع لشروط التسليم المتفق عليها مسبقاً.</p>
           </div>
           
           <div className="space-y-4 min-w-[300px]">
              <div className="flex justify-between items-center text-text-secondary px-2">
                 <span className="font-bold text-sm uppercase tracking-widest opacity-70">إجمالي المشروع</span>
                 <span className="text-xl font-bold font-mono">{totalAgreed.toLocaleString()} <EGP /></span>
              </div>
              <div className="flex justify-between items-center text-green-600 px-2">
                 <span className="font-bold text-sm uppercase tracking-widest opacity-70">إجمالي المدفوع حتى تاريخه</span>
                 <span className="text-xl font-bold font-mono">-{totalPaid.toLocaleString()} <EGP /></span>
              </div>
              <div className="h-px bg-border-theme my-2"></div>
              <div className="flex justify-between items-center bg-text-primary text-bg-surface p-6 rounded-3xl shadow-xl shadow-text-primary/10">
                 <span className="font-bold text-base uppercase tracking-[0.2em]">المبلغ المتبقي</span>
                 <span className="text-4xl font-bold font-mono">{remaining.toLocaleString()} <EGP /></span>
              </div>
           </div>
        </div>

        <div className="h-[140mm] bg-bg-surface w-full mt-8"></div>

      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .print\\:hidden { display: none !important; }
          #invoice-container {
             box-shadow: none !important;
             border: none !important;
             width: 100% !important;
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default TaskInvoice;
