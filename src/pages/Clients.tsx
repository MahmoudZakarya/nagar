import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { Phone, MapPin, Plus, X, Search, Hash, MoreVertical, Edit2 } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const Clients = () => {
  const { clients, loading, error, addClient, updateClient } = useClients();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  
  const [clientForm, setClientForm] = useState({
    name: '',
    phone_1: '',
    phone_2: '',
    address: ''
  });

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-[#854836]/20 border-t-[#854836] rounded-full animate-spin"></div>
    </div>
  );
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone_1.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && editingClientId) {
      await updateClient(editingClientId, clientForm);
    } else {
      await addClient(clientForm);
    }
    closeModal();
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setClientForm({ name: '', phone_1: '', phone_2: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setIsEditMode(true);
    setEditingClientId(client.id);
    setClientForm({
      name: client.name,
      phone_1: client.phone_1,
      phone_2: client.phone_2 || '',
      address: client.address || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingClientId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#854836] tracking-tight">العملاء</h1>
          <p className="text-gray-500 font-medium mt-1">إدارة بيانات العملاء والتواصل</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="بحث عن عميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-[#854836]/10 outline-none font-medium"
              />
           </div>
           <button 
             onClick={openAddModal}
             className="bg-[#854836] text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-[#854836]/20 hover:shadow-[#854836]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
           >
             <Plus className="w-5 h-5" />
             <span>عميل جديد</span>
           </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">لم يتم العثور على عملاء</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-8 bg-[#FFB22C] rounded-full"></div>
                   <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                </div>
                <button 
                  onClick={() => openEditModal(client)}
                  className="text-gray-300 hover:text-[#854836] transition-colors p-2 hover:bg-gray-50 rounded-xl"
                >
                   <Edit2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span dir="ltr">{client.phone_1}</span>
                </div>
                {client.phone_2 && (
                   <div className="flex items-center gap-3 text-gray-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-orange-50/50 flex items-center justify-center text-orange-600/70">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span dir="ltr">{client.phone_2}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-3 text-gray-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-300" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">كود: {client.id}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <Link to={`/clients/${client.id}`} className="text-xs font-bold text-[#854836] uppercase tracking-widest hover:underline">الملف الشخصي</Link>
                     <span className="text-gray-200">|</span>
                      <Link to={`/tasks?search=${client.phone_1}`} className="text-xs font-bold text-[#854836] uppercase tracking-widest hover:underline">عرض المشاريع</Link>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-2xl font-bold text-[#854836]">
                   {isEditMode ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-xl transition">
                   <X className="w-6 h-6 text-gray-400" />
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
                     className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold"
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
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold italic"
                        placeholder="01xxxxxxxxx"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف 2</label>
                      <input 
                        type="text" 
                        value={clientForm.phone_2}
                        onChange={(e) => setClientForm({...clientForm, phone_2: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold italic"
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
                     className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#854836]/10 outline-none font-bold resize-none"
                     placeholder="عنوان العميل بالتفصيل..."
                   />
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                     className="w-full bg-[#854836] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#854836]/20 hover:shadow-[#854836]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                   >
                     {isEditMode ? 'حفظ التغييرات' : 'حفظ بيانات العميل'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
