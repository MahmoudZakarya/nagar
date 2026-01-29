import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import logo from '../assets/nagar-logo-removebg.png';
import whatsapp from '../assets/whatsapp.svg';
import { Printer, ArrowRight, Save, Phone, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

const EGP = () => <span className="text-[0.7em] font-normal mr-1">جنية</span>;

const TaskInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { task, payments, loading } = useTask(id);
  const [isExporting, setIsExporting] = useState(false);

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
  if (!task) return <div className="p-20 text-center text-red-500 font-bold">عذراً، لم يتم العثور على المشروع</div>;

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalAgreed = (task.total_agreed_price || 0) + (task.extra_costs || 0);
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
        <div className="flex gap-4">
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
                    <span className="text-lg font-black text-text-primary font-mono bg-bg-surface px-3 py-1 rounded-lg border border-border-theme">#{task.id}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest min-w-[80px]">عرض السعر:</span>
                    <span className="  w-48 h-10 bg-bg-surface px-3 py-1 rounded-lg border border-border-theme"> </span>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-widest min-w-[80px]">التاريخ:</span>
                    <span className="text-lg font-bold text-text-primary">{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
             </div>
           </div>

           <div className="relative z-10 flex flex-col items-end text-left">
             <img src={logo} alt="Nagar Logic" className="h-24 object-contain mb-2 bg-black print:bg-black border rounded-xl p-2 border-transparent" />
             <div className="text-sm space-y-1 text-text-primary font-bold" dir="ltr">
                <p className="text-text-primary text-xl font-bold">نجار للأعمال الهندسية</p>
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
                    <p className="text-xl font-bold text-text-primary mb-1">{task.client_name}</p>
                    <p className="text-text-secondary h-6 font-bold" dir="ltr"></p>
                </div>
             </div>
          </div>

          <div className="space-y-2">
             <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    عنوان المشروع
                </h3>
                <div className="bg-bg-primary/50 py-4 px-6 rounded-3xl border border-border-theme">
                    <p className="text-xl font-bold text-text-primary mb-1">{task.title}</p>
                    <p className="text-text-secondary font-bold">تسجيل بتاريخ: {new Date(task.registered_at).toLocaleDateString('ar-EG')}</p>
                </div>
             </div>
          </div>
          
          <div className="col-span-2">
             <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                وصف العمل
             </h3>
             <div className="bg-bg-primary/30 py-4 px-6 rounded-3xl border border-border-theme italic text-text-primary leading-relaxed font-medium">
                {task.description || 'لم يتم تحديد وصف دقيق للمشروع.'}
             </div>
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
              {payments?.map((p, index) => (
                <tr key={p.id} className="bg-bg-primary/20 hover:bg-bg-primary/40 transition-colors">
                  <td className="py-2 px-6 font-bold text-text-muted text-center border-b border-border-theme/50">{index + 1}</td>
                  <td className="py-2 px-6 font-bold text-text-primary border-b border-border-theme/50">{new Date(p.payment_date).toLocaleDateString('ar-EG')}</td>
                  <td className="py-2 px-6 text-text-primary font-medium border-b border-border-theme/50">{p.note || '-'}</td>
                  <td className="py-2 px-6 text-left font-black text-text-primary border-b border-border-theme/50 min-w-[120px]">
                    {p.amount.toLocaleString()} <EGP />
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
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
