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
    <div className="bg-bg-primary min-h-screen p-2 text-right print:p-0 print:bg-white print:min-h-0 print:overflow-visible transition-colors duration-300" dir="rtl">
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
      <div id="quotation-container" className="bg-bg-surface mx-auto flex flex-col relative print:bg-white print:w-full print:max-w-none print:m-0 print:flex print:flex-col print:h-auto print:shadow-none min-h-[290mm] print:min-h-[337mm] shadow-xl border border-border-theme transition-colors duration-300">
        
        {/* Header */}
        <div className="relative h-48 bg-brand-main overflow-hidden flex justify-between items-center px-12 print:px-8">
           <div className="absolute inset-0 opacity-90"></div>
           
           <div className="relative z-10 text-white">
             <h1 className="text-3xl font-bold mb-1">عرض سعر</h1>
             <p className="text-lg font-semibold opacity-90">QUOTATION</p>
             <div className="mt-2 space-y-1 text-sm font-medium text-white/90">
               <p>رقم العرض: {quotation.quotation_number}</p>
               <p>التاريخ: {new Date(quotation.created_at).toLocaleDateString('ar-EG')}</p>
             </div>
           </div>

           <div className="relative z-10">
             <img src={logo} alt="Nagar Logic" className="h-28 object-contain" />
           </div>
        </div>

        {/* Client Info */}
        <div className="px-12 py-6 print:px-8">
          <div className="bg-bg-primary/50 border-r-4 border-brand-main p-4 rounded-lg print:bg-white print:border-gray-300 transition-colors duration-300">
            <h3 className="text-brand-main dark:text-brand-secondary font-bold text-sm mb-1">إلى السيد / السيدة:</h3>
            <p className="text-xl font-bold text-text-primary">{client?.name || '...'}</p>
            {client?.address && <p className="text-sm text-text-secondary mt-1">{client.address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="px-12 flex-1 print:flex-1 print:px-8 mb-8 overflow-visible flex flex-col">
          <table className="w-full border-separate table-fixed overflow-visible" style={{ borderSpacing: '0 8px' }}>
            <thead>
              <tr className="bg-brand-main text-brand-third">
                <th className="py-3 px-3 text-right w-[5%] border-b border-brand-main rounded-r-lg">#</th>
                <th className="py-3 px-3 text-right w-[20%] border-b border-brand-main">صورة</th>
                <th className="py-3 px-3 text-right w-auto border-b border-brand-main">البند</th>
                <th className="py-3 px-3 text-center w-[10%] border-b border-brand-main">الكمية</th>
                <th className="py-3 px-3 text-center w-[10%] border-b border-brand-main">سعر المتر</th>
                <th className="py-3 px-3 text-center w-[10%] border-b border-brand-main">سعر الوحدة</th>
                <th className="py-3 px-3 text-center w-[15%] border-b border-brand-main rounded-l-lg">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, index) => (
                <tr key={index} className="border-b border-border-theme break-inside-avoid bg-transparent transition-colors duration-300">
                  <td className="py-4 px-3 font-bold text-text-muted text-center rounded-r-lg">{index + 1}</td>
                  <td className="py-2 px-2 align-top">
                     {item.image_path && (
                       <img 
                         src={`${API_URL}${item.image_path}`} 
                         alt="" 
                         className="w-42 h-36 object-contain rounded"
                       />
                     )}
                  </td>
                  <td className="py-4 px-3 align-top overflow-hidden">
                    <h4 className="font-bold text-lg text-text-primary break-words">{item.item_name}</h4>
                    <p className="text-text-secondary text-sm mt-1 whitespace-pre-wrap break-words">{item.description}</p>
                  </td>
                   <td className="py-4 px-3 text-center font-bold text-text-secondary align-top">{item.quantity}</td>
                   <td className="py-4 px-3 text-center text-text-secondary align-top">{item.meter_price > 0 ? item.meter_price.toLocaleString() : '-'}</td>
                   <td className="py-4 px-3 text-center text-text-secondary align-top">{item.unit_price > 0 ? item.unit_price.toLocaleString() : '-'}</td>
                   <td className="py-4 px-3 text-center font-bold text-brand-main dark:text-brand-secondary align-top rounded-l-lg">
                     {item.row_total.toLocaleString()}
                   </td>
                </tr>
              ))}
              
              {/* Totals integrated at the end of body */}
              <tr className="break-inside-avoid border-t-2 border-brand-main">
                  <td colSpan={6} className="py-3 px-4 text-left font-bold text-gray-600">المجموع:</td>
                  <td className="py-3 px-3 text-center font-bold text-lg text-brand-main">
                    {quotation.total_amount.toLocaleString()}
                  </td>
              </tr>
              {quotation.discount > 0 && (
                <tr className="break-inside-avoid border-t border-gray-100">
                   <td colSpan={6} className="py-3 px-4 text-left font-bold text-gray-600">الخصم:</td>
                   <td className="py-3 px-3 text-center font-bold text-lg text-red-600">
                     -{quotation.discount.toLocaleString()}
                   </td>
                </tr>
              )}
              <tr className="break-inside-avoid bg-brand-main text-brand-third">
                 <td colSpan={6} className="py-4 px-4 text-left font-bold text-xl rounded-r-lg">الإجمالي النهائي:</td>
                 <td className="py-4 px-3 text-center font-bold text-2xl rounded-l-lg">
                   {(quotation.total_amount - (quotation.discount || 0)).toLocaleString()} <span className="text-sm font-normal mr-1">جنية</span>
                 </td>
              </tr>
            </tbody>

            <tfoot>
               <tr>
                  <td colSpan={7}>
                     <div className="pt-8 pb-4 mt-2 border-t border-gray-200 flex justify-between items-center text-xs text-text-primary font-medium print:mt-2">
                        <div className="flex gap-4">
                          <span className="font-bold">النجار للأعمال الهندسية</span>
                          <span>|</span>
                          <span>01000000000</span>
                          <span>|</span>
                          <span>www.nagar-engineering.com</span>
                        </div>
                        <div>
                          <span>123 شارع الصناعة، القاهرة</span>
                        </div>
                     </div>
                  </td>
               </tr>
            </tfoot>
          </table>
          
 

        </div>
        <div className="w-full h-[337mm]  print:break-before-page" style={{ breakBefore: 'page' }}></div>
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
            background: white !important;
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
            border-collapse: collapse !important;
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

          .bg-\[\#854836\] {
            background-color: var(--main-color) !important;
            -webkit-print-color-adjust: exact;
            color: var(--third-color) !important;
          }

          .text-\[\#854836\] {
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
