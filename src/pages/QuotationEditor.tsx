import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotations, QuotationItem } from '../hooks/useQuotations';
import API_URL from '../config/api';
import { useClients } from '../hooks/useClients';
import { Plus, Trash2, Save, Eye, Upload, ChevronUp, ChevronDown } from 'lucide-react';

const QuotationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createQuotation, updateQuotation, getQuotationById, uploadImage, loading: saving } = useQuotations();
  const { clients } = useClients();

  const [clientId, setClientId] = useState<number | ''>('');
  const [quotationNumber, setQuotationNumber] = useState(`QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Accepted' | 'Rejected'>('Draft');

  useEffect(() => {
    if (id) {
      loadQuotation(parseInt(id));
    } else {
      // Initialize with one empty row
      addItem();
    }
  }, [id]);

  const loadQuotation = async (quotationId: number) => {
    const data = await getQuotationById(quotationId);
    if (data) {
      setClientId(data.client_id);
      setQuotationNumber(data.quotation_number);
      setStatus(data.status);
      setDiscount(data.discount || 0);
      setItems(data.items || []);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        description: '',
        image_path: '',
        meter_price: 0,
        unit_price: 0,
        quantity: 1,
        row_total: 0,
        sort_order: items.length,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate row total
    if (field === 'unit_price' || field === 'quantity') {
      newItems[index].row_total = newItems[index].unit_price * newItems[index].quantity;
    }
    
    setItems(newItems);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const filePath = await uploadImage(file);
      updateItem(index, 'image_path', filePath);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('فشل تحميل الصورة');
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.row_total || 0), 0);
  };

  const handleSave = async (redirect: boolean = false) => {
    if (!clientId) {
      alert('الرجاء اختيار العميل');
      return;
    }
    
    const quotationData = {
      client_id: Number(clientId),
      quotation_number: quotationNumber,
      items: items.map((item, index) => ({ ...item, sort_order: index })),
      total_amount: calculateTotal(),
      discount,
      status,
    };

    try {
      let savedId = id;
      if (id) {
        await updateQuotation(parseInt(id), quotationData);
      } else {
        const res = await createQuotation(quotationData);
        savedId = res.id;
      }
      
      if (redirect && savedId) {
        navigate(`/quotations/${savedId}/preview`);
      } else {
        alert('تم الحفظ بنجاح');
        if (!id && savedId) navigate(`/quotations/${savedId}/edit`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#854836]">تحرير عرض سعر</h1>
        <div className="flex gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#854836] text-white rounded-lg hover:bg-[#854836]/90"
          >
            <Save className="w-4 h-4" />
            <span>حفظ مسودة</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB22C] text-black rounded-lg hover:bg-[#FFB22C]/90"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة / طباعة</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العميل</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB22C] focus:border-transparent"
            >
              <option value="">اختر العميل</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم العرض</label>
            <input
              type="text"
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB22C] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB22C] focus:border-transparent"
            >
              <option value="Draft">مسودة</option>
              <option value="Sent">تم الإرسال</option>
              <option value="Accepted">مقبول</option>
              <option value="Rejected">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-[#854836] text-white">
              <th className="px-4 py-3 text-right w-16">#</th>
              <th className="px-4 py-3 text-right w-24">صورة</th>
              <th className="px-4 py-3 text-right w-64 min-w-[200px]">البند</th>
              <th className="px-4 py-3 text-right w-1/3 min-w-[300px]">الوصف</th>
              <th className="px-4 py-3 text-right w-48 min-w-[100px]">سعر المتر</th>
              <th className="px-4 py-3 text-right w-36">سعر الوحدة</th>
              <th className="px-4 py-3 text-right w-32">الكمية</th>
              <th className="px-4 py-3 text-right w-36">الإجمالي</th>
              <th className="px-4 py-3 text-right rounded-tl-lg w-32">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group">
                    {item.image_path ? (
                      <img
                        src={`${API_URL}${item.image_path}`}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(index, e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.item_name}
                    onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C]"
                    placeholder="اسم البند"
                  />
                </td>
                <td className="px-4 py-3">
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C] resize-none"
                    rows={2}
                    placeholder="الوصف"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.meter_price}
                    onChange={(e) => updateItem(index, 'meter_price', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C]"
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-[#854836]">
                  {item.row_total.toLocaleString()} جنية
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-[#854836] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      className="p-1 text-gray-500 hover:text-[#854836] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={7} className="px-4 py-3 text-left font-bold text-lg">مجموع البنود:</td>
              <td className="px-4 py-3 font-bold text-lg text-[#854836]">
                {calculateTotal().toLocaleString()} جنية
              </td>
              <td></td>
            </tr>
            <tr className="bg-white border-t border-gray-100">
               <td colSpan={7} className="px-4 py-3 text-left font-bold">الخصم:</td>
               <td className="px-4 py-3">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full max-w-[150px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#FFB22C] font-bold text-[#854836]"
                    placeholder="0"
                  />
               </td>
               <td></td>
            </tr>
            <tr className="bg-[#854836] text-white">
               <td colSpan={7} className="px-4 py-3 text-left font-bold text-xl">الإجمالي الصافي:</td>
               <td className="px-4 py-3 font-bold text-xl">
                  {(calculateTotal() - discount).toLocaleString()} جنية
               </td>
               <td></td>
            </tr>
          </tfoot>
        </table>
        
        <button
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-[#854836] font-medium hover:bg-[#854836]/5 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة بند جديد</span>
        </button>
      </div>
    </div>
  );
};

export default QuotationEditor;
