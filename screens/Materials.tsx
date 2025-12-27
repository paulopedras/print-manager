
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { MaterialComponent } from '../types';
import { Icon } from '../constants';
import { useAuth } from '../components/AuthContext';

const Materials: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [components, setComponents] = useState<MaterialComponent[]>([]);
  const [hardwareThreshold, setHardwareThreshold] = useState(3);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0.50,
    quantity: 10,
    imageUrl: ''
  });

  const HW_KEY = getStorageKey('hardware_db');
  const THRESHOLD_KEY = getStorageKey('hardwareThreshold');

  useEffect(() => {
    const savedHwThreshold = localStorage.getItem(THRESHOLD_KEY);
    if (savedHwThreshold) {
      setHardwareThreshold(parseInt(savedHwThreshold));
    }

    const saved = localStorage.getItem(HW_KEY);
    if (saved) {
      setComponents(JSON.parse(saved));
    } else {
      setComponents([]);
    }
  }, [HW_KEY, THRESHOLD_KEY]);

  useEffect(() => {
    if (components.length >= 0) {
      localStorage.setItem(HW_KEY, JSON.stringify(components));
    }
  }, [components, HW_KEY]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0.50,
      quantity: 10,
      imageUrl: ''
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (comp: MaterialComponent) => {
    setFormData({
      name: comp.name,
      price: comp.price,
      quantity: comp.quantity,
      imageUrl: comp.imageUrl
    });
    setEditingId(comp.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmId(id);
    setActiveMenuId(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const updated = components.filter(c => c.id !== deleteConfirmId);
      setComponents(updated);
      setDeleteConfirmId(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: MaterialComponent[];
    
    if (editingId) {
      updated = components.map(c => c.id === editingId ? {
        ...c,
        name: formData.name,
        price: formData.price,
        quantity: formData.quantity,
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400`
      } : c);
    } else {
      const newComp: MaterialComponent = {
        id: Date.now().toString(),
        name: formData.name,
        price: formData.price,
        quantity: formData.quantity,
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400`
      };
      updated = [newComp, ...components];
    }

    setComponents(updated);
    setIsModalOpen(false);
    resetForm();
  };

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnits = filteredComponents.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalInventoryValue = filteredComponents.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const lowStockCount = filteredComponents.filter(c => c.quantity < hardwareThreshold).length;

  const getDynamicInsights = () => {
    const runningOut = components.filter(c => c.quantity < hardwareThreshold)
      .sort((a, b) => a.quantity - b.quantity);
    
    const insights = [];
    if (runningOut.length > 0) {
      runningOut.slice(0, 2).forEach(item => {
        insights.push({
          icon: 'warning',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          text: <span className="text-slate-400 font-medium leading-tight text-xs">
            <span className="font-bold text-white uppercase text-[10px] block mb-0.5">Stock Alert</span>
            <span className="font-bold text-slate-300">{item.name}</span> is low (<span className="text-red-500 font-bold">{item.quantity} units</span>)
          </span>
        });
      });
    }

    if (components.length > 0) {
      const highValueItem = [...components].sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))[0];
      if (highValueItem) {
        insights.push({
          icon: 'stars',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          text: <span className="text-slate-400 font-medium leading-tight text-xs">
            <span className="font-bold text-white uppercase text-[10px] block mb-0.5">Top Investment</span>
            <span className="font-bold text-primary">{highValueItem.name}</span> has your highest tied capital.
          </span>
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        icon: 'verified',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        text: <span className="text-slate-400 font-medium">Hardware levels are optimal!</span>
      });
    }

    return insights;
  };

  return (
    <div className="p-8 pb-20">
      <Header 
        title="Hardware Inventory" 
        subtitle="Manage fasteners, electronics, and small parts" 
        onAction={openAddModal} 
        actionIcon="add"
        showNotifications={false}
      />
      
      <div className="max-w-7xl mx-auto flex flex-col gap-6 mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-9 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 bg-surface-dark/40 border border-slate-800 shadow-sm flex flex-col justify-between h-32">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Icon name="hardware" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Units</p>
                </div>
                <p className="text-4xl font-black text-white">{totalUnits}</p>
              </div>
              <div className="rounded-2xl p-6 bg-surface-dark/40 border border-slate-800 shadow-sm flex flex-col justify-between h-32">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Icon name="sell" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Inventory Value</p>
                </div>
                <p className="text-4xl font-black text-white">€{totalInventoryValue.toFixed(2)}</p>
              </div>
              <div className={`rounded-2xl p-6 border shadow-sm transition-all flex flex-col justify-between h-32 ${lowStockCount > 0 ? 'bg-red-500/5 border-red-900/30' : 'bg-surface-dark/40 border-slate-800'}`}>
                <div className={`flex items-center gap-3 mb-2 ${lowStockCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <Icon name={lowStockCount > 0 ? 'warning' : 'check_circle'} />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Low Stock Items</p>
                </div>
                <p className="text-4xl font-black text-white">{lowStockCount}</p>
              </div>
            </div>

            <div className="bg-surface-dark/40 p-3 rounded-2xl border border-slate-800 shadow-sm">
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="search" />
                </div>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="Search components by name..." 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredComponents.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-surface-dark/20 rounded-[3rem] border-2 border-dashed border-slate-800">
                  <Icon name="precision_manufacturing" className="text-6xl text-slate-800 mb-4" />
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No components found</p>
                </div>
              ) : (
                filteredComponents.map(comp => {
                  const isLow = comp.quantity < hardwareThreshold;
                  const isMenuActive = activeMenuId === comp.id;

                  return (
                    <div key={comp.id} className={`flex flex-col gap-5 rounded-[2rem] bg-surface-dark/40 p-6 border ${isLow ? 'border-red-900/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' : 'border-slate-800'} shadow-sm hover:shadow-lg hover:border-slate-700 transition-all group relative overflow-hidden`}>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-lg text-white line-clamp-1 leading-tight flex-1">
                          {comp.name}
                        </h3>
                        <div className="relative shrink-0">
                          <button 
                            onClick={() => setActiveMenuId(isMenuActive ? null : comp.id)}
                            className="size-8 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500 transition-colors"
                          >
                            <Icon name="more_horiz" className="text-xl" />
                          </button>
                          
                          {isMenuActive && (
                            <div className="absolute right-0 top-10 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              <button 
                                onClick={() => openEditModal(comp)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold hover:bg-slate-800 text-slate-200 transition-colors text-left"
                              >
                                <Icon name="edit" className="text-base text-primary" /> Edit Details
                              </button>
                              <button 
                                onClick={() => requestDelete(comp.id)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold hover:bg-red-900/20 text-red-500 transition-colors text-left"
                              >
                                <Icon name="delete" className="text-base" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="relative size-20 shrink-0 rounded-2xl overflow-hidden shadow-inner border border-slate-800 bg-slate-900">
                          <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-primary tracking-tighter">{comp.price.toFixed(2)}€</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">PER UNIT</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">AVAILABLE STOCK</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-3xl font-black leading-none ${isLow ? 'text-red-500' : 'text-white'}`}>{comp.quantity}</span>
                              <span className="text-[10px] font-bold text-slate-600 uppercase">UNITS</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${isLow ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}></div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isLow ? 'text-red-500' : 'text-slate-600'}`}>
                            {isLow ? 'LOW STOCK ALERT' : 'HEALTHY INVENTORY'}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">ID: {comp.id.slice(-4)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="bg-surface-dark/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-sm h-full">
              <h3 className="font-black text-xl mb-8 flex items-center gap-3 text-primary">
                <Icon name="auto_awesome" /> Dynamic Insights
              </h3>
              <ul className="flex flex-col gap-6">
                {getDynamicInsights().map((insight, idx) => (
                  <li key={idx} className="flex gap-4 group items-start animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`size-10 rounded-2xl ${insight.bg} ${insight.color} flex items-center justify-center shrink-0 shadow-sm border border-white/5`}>
                      <Icon name={insight.icon} className="text-xl" />
                    </div>
                    <div className="flex-1">{insight.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-800">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="size-14 bg-primary text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Icon name={editingId ? 'edit' : 'add'} className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black leading-none text-white">{editingId ? 'Edit Component' : 'New Hardware'}</h2>
                  <p className="text-sm text-slate-500 mt-1">{editingId ? 'Modify component specifications' : 'Add new item to hardware catalog'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-500 transition-colors">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-10 flex flex-col gap-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Component Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. M3 x 12mm Bolt"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Unit Price (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Initial Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Image URL</label>
                  <div className="flex items-center gap-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 ring-1 ring-slate-800">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                           <Icon name="image" className="text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pt-6 sticky bottom-0 bg-surface-dark py-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-900 text-slate-400 font-black h-16 rounded-3xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] bg-primary text-white font-black h-16 rounded-3xl shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest text-xs">
                  {editingId ? 'Save Changes' : 'Register Hardware'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-800 p-10 text-center">
            <div className="size-24 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-500/20">
              <Icon name="delete_forever" className="text-5xl" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-white">Remove Hardware?</h2>
            <p className="text-slate-400 mb-10 font-medium leading-relaxed">
              Are you sure you want to permanently delete this item from the hardware database?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-slate-900 text-slate-400 font-black h-16 rounded-3xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs">
                Keep it
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-black h-16 rounded-3xl shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95 uppercase tracking-widest text-xs">
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
