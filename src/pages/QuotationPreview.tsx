import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotations, Quotation } from '../hooks/useQuotations';
import { useClients } from '../hooks/useClients';
import API_URL from '../config/api';
import logo from '../assets/nagar-logo-removebg.png';
import { Printer, ArrowRight, Edit, Save } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: {
      savePDF: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
    };
  }
}

const QuotationPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getQuotationById } = useQuotations();
  const { clients } = useClients();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      const loadData = async () => {
        const data = await getQuotationById(parseInt(id));
        if (data) {
          setQuotation(data);
        }
      };
      loadData();
    }
  }, [id, getQuotationById]);

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

  const client = clients.find(c => c.id === quotation?.client_id);

  if (!quotation) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen p-2 text-right print:p-0  print:min-h-0 print:overflow-visible transition-colors duration-300" dir="rtl">
      {/* Action Bar - Hidden in Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/quotations/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-theme rounded-lg hover:bg-bg-surface-hover text-text-secondary transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>تعديل</span>
          </button>
          <button
            onClick={handleSavePDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 bg-brand-secondary text-brand-main font-bold rounded-lg hover:bg-brand-secondary/90 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>حفظ كـ PDF (أصلي)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2 bg-brand-main text-brand-third rounded-lg hover:bg-brand-main/90 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Container */}
      <div id="quotation-container" className="bg-bg-surface mx-auto flex flex-col relative  print:w-full print:max-w-none print:m-0 print:flex print:flex-col print:h-auto print:shadow-none min-h-[290mm] shadow-xl border border-border-theme transition-colors duration-300">
        
        {/* Header */}
        <div className="relative h-auto bg-brand-main overflow-hidden flex justify-between items-start px-12 py-8 print:px-8">
           <div className="absolute inset-0 opacity-90"></div>
           
           <div className="relative z-10 text-white pt-2">
             <h1 className="text-4xl font-bold mb-2">عرض سعر</h1>
             <p className="text-xl font-semibold opacity-90 tracking-wider">Quotation</p>
             <div className="mt-4 space-y-1 text-base font-medium text-white/90">
               <div className="flex gap-2">
                 <span className="opacity-75">رقم العرض:</span>
                 <span className="font-bold font-mono">{quotation.quotation_number}</span>
               </div>
               <div className="flex gap-2">
                 <span className="opacity-75">التاريخ:</span>
                 <span className="font-bold ">{new Date(quotation.created_at).toLocaleDateString('ar-EG')}</span>
               </div>
             </div>
           </div>

           <div className="relative z-10 flex flex-col items-end text-left text-white">
             <img src={logo} alt="Nagar Logic" className="h-24 object-contain mb-4  rounded-lg p-2 backdrop-blur-sm" />
             <div className="text-sm space-y-1 opacity-95" dir="ltr">
                <p className="font-bold text-lg">النجار للأعمال الهندسية</p>
                <p>01000000000</p>
                <p>123 شارع الصناعة، القاهرة</p>
             </div>
           </div>
        </div>

        {/* Client Info */}
        <div className="px-12 py-8 print:px-8">
          <div className="bg-bg-primary/50 border-r-4 border-brand-main p-6 rounded-lg  transition-colors duration-300 shadow-sm">
            <h3 className="text-text-primary dark:text-brand-secondary font-bold text-sm mb-2 opacity-80">إلى السيد / السيدة:</h3>
            <p className="text-2xl font-bold text-text-primary">{client?.name || '...'}</p>
            {client?.address && <p className="text-base text-text-secondary mt-1">{client.address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="px-12 flex-1 print:flex-1 print:px-8 mb-8 overflow-visible flex flex-col gap-0">
          <table className="w-full border-separate table-fixed overflow-visible" style={{ borderSpacing: '0 8px' }}>
            <thead>
              <tr className="bg-brand-main text-brand-third">
                <th className="py-4 px-4 text-right w-[5%] border-b border-brand-main rounded-r-lg font-bold">#</th>
                <th className="py-4 px-4 text-right w-[15%] border-b border-brand-main font-bold">صورة</th>
                <th className="py-4 px-4 text-right w-auto border-b border-brand-main font-bold">البند</th>
                <th className="py-4 px-4 text-center w-[10%] border-b border-brand-main font-bold">الكمية</th>
                <th className="py-4 px-4 text-center w-[12%] border-b border-brand-main font-bold">سعر المتر</th>
                <th className="py-4 px-4 text-center w-[12%] border-b border-brand-main font-bold">سعر الوحدة</th>
                <th className="py-4 px-4 text-center w-[15%] border-b border-brand-main rounded-l-lg font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, index) => (
                <tr key={index} className="break-inside-avoid bg-transparent transition-colors duration-300 group">
                  <td className="py-4 px-4 font-bold text-text-muted text-center rounded-r-lg border-b border-border-theme group-last:border-0">{index + 1}</td>
                  <td className="py-4 px-4 align-top border-b border-border-theme group-last:border-0">
                     {item.image_path && (
                       <img 
                         src={`${API_URL}${item.image_path}`} 
                         alt="" 
                         className="w-24 h-24 object-contain rounded-lg "
                       />
                     )}
                  </td>
                  <td className="py-4 px-4 align-top border-b border-border-theme group-last:border-0">
                    <h4 className="font-bold text-lg text-text-primary break-words">{item.item_name}</h4>
                    <p className="text-text-secondary text-sm mt-2 whitespace-pre-wrap break-words leading-relaxed">{item.description}</p>
                  </td>
                   <td className="py-4 px-4 text-center font-bold text-text-secondary align-top border-b border-border-theme group-last:border-0">{item.quantity}</td>
                   <td className="py-4 px-4 text-center text-text-secondary align-top border-b border-border-theme group-last:border-0 font-mono">{item.meter_price > 0 ? item.meter_price.toLocaleString() : '-'}</td>
                   <td className="py-4 px-4 text-center text-text-secondary align-top border-b border-border-theme group-last:border-0 font-mono">{item.unit_price > 0 ? item.unit_price.toLocaleString() : '-'}</td>
                   <td className="py-4 px-4 text-center font-bold text-brand-secondary dark:text-brand-secondary align-top rounded-l-lg border-b border-border-theme group-last:border-0 font-mono">
                     {item.row_total.toLocaleString()}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Notes & Totals Section */}
          <div className="mt-8 flex gap-8 break-inside-avoid ">
            
            {/* Notes Section - 60% width */}
            <div className="flex-[1.5] bg-bg-primary/30 p-6 rounded-xl border border-border-theme">
              <h3 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-text-primary rounded-full inline-block"></span>
                ملاحظات وشروط
              </h3>
              <ul className="text-text-secondary text-sm space-y-2 list-disc list-inside leading-relaxed opacity-80">
                <li>هذا العرض ساري لمدة 15 يوم من تاريخه.</li>
                <li>الأسعار تشمل التوريد والتركيب ما لم يذكر خلاف ذلك.</li>
                <li>يتم دفع 50% مقدم، و 50% عند الاستلام.</li>
                <li>لوريم إيبسوم دولار سيت أميت ،كونسيكتيتور أدايبا يسكينج أليايت ،سيت دو أيوسمود تيمبور أنكايديديونتيوت لابوري ات دولار ماجنا أليكيوا .</li>
              </ul>
            </div>

            {/* Totals Section - 40% width */}
            <div className="flex-1 bg-brand-main/5 p-6 rounded-xl border border-brand-main/20 h-fit">
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-text-secondary">
                   <span className="font-medium">المجموع الفرعي</span>
                   <span className="font-bold font-mono text-lg">{quotation.total_amount.toLocaleString()}</span>
                 </div>
                 
                 {quotation.discount > 0 && (
                   <div className="flex justify-between items-center text-red-600">
                     <span className="font-medium">خصم</span>
                     <span className="font-bold font-mono text-lg">-{quotation.discount.toLocaleString()}</span>
                   </div>
                 )}
                 
                 <div className="my-4 border-t border-brand-main/20"></div>

                 <div className="flex justify-between items-center text-text-primary">
                   <span className="font-bold text-lg">الإجمالي النهائي</span>
                   <div className="flex items-baseline gap-1">
                     <span className="font-bold font-mono text-3xl">{(quotation.total_amount - (quotation.discount || 0)).toLocaleString()}</span>
                     <span className="text-sm font-medium">جنية</span>
                   </div>
                 </div>
               </div>
            </div>

          </div>

        </div>
        
        {/* Decorative Bottom Bar */}
        <div className="h-4 bg-brand-main w-full mt-auto print:hidden"></div>
        <div className="h-[290mm] bg-bg-surface w-full break-inside-avoid "></div>
      </div>
      
      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 0; 
          }
          
          .print\:hidden { display: none !important; }
          
          html, body, #root, .bg-gray-100 { 
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #quotation-container {
             display: block !important;
             height: auto !important;
             min-height: 0 !important;
             max-height: none !important;
             margin: 0 !important;
             padding: 0 !important;
             border: none !important;
             box-shadow: none !important;
          }

          table { 
            display: table !important;
            width: 100% !important;
            page-break-inside: auto !important;
          }
          
          
          thead { display: table-row-group !important; }
          tfoot { display: table-row-group !important; }
          
          tr { 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          td, th {
            border-bottom: 1px solid #eee !important;
          }

          .bg-brand-main {
            background-color: var(--main-color) !important;
            -webkit-print-color-adjust: exact;
            color: var(--third-color) !important;
          }

          .text-brand-main {
            color: var(--main-color) !important;
            -webkit-print-color-adjust: exact;
          }

          .text-red-600 {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact;
          }
          
          img {
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
          
          * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuotationPreview;
