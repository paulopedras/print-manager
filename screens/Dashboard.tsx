
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Filament, MaterialConfig } from '../types';
import { Icon } from '../constants';
import { useAuth } from '../components/AuthContext';

const Dashboard: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [materialConfigs, setMaterialConfigs] = useState<MaterialConfig[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Bambu Lab',
    type: 'PLA',
    color: '#3b82f6',
    weight: 1000,
    spoolCount: 1,
    price: 19.99
  });

  const FILAMENTS_KEY = getStorageKey('filaments_db');
  const CONFIGS_KEY = getStorageKey('materialConfigs');

  useEffect(() => {
    const savedConfigs = localStorage.getItem(CONFIGS_KEY);
    let configs: MaterialConfig[] = [];
    if (savedConfigs) {
      configs = JSON.parse(savedConfigs);
      setMaterialConfigs(configs);
    } else {
      configs = [
        { type: 'PLA', threshold: 200 },
        { type: 'PETG', threshold: 200 },
        { type: 'ABS', threshold: 200 },
        { type: 'TPU', threshold: 100 },
        { type: 'ASA', threshold: 200 }
      ];
      setMaterialConfigs(configs);
      localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
    }

    const savedFilaments = localStorage.getItem(FILAMENTS_KEY);
    if (savedFilaments) {
      setFilaments(JSON.parse(savedFilaments));
    } else {
      const defaultFilaments: Filament[] = [];
      setFilaments(defaultFilaments);
      localStorage.setItem(FILAMENTS_KEY, JSON.stringify(defaultFilaments));
    }
  }, [FILAMENTS_KEY, CONFIGS_KEY]);

  useEffect(() => {
    if (filaments.length >= 0) {
      localStorage.setItem(FILAMENTS_KEY, JSON.stringify(filaments));
    }
  }, [filaments, FILAMENTS_KEY]);

  const getThresholdForType = (type: string) => {
    const config = materialConfigs.find(m => m.type === type);
    return config ? config.threshold : 200;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: 'Bambu Lab',
      type: materialConfigs[0]?.type || 'PLA',
      color: '#3b82f6',
      weight: 1000,
      spoolCount: 1,
      price: 19.99
    });
    setEditingFilamentId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (fil: Filament) => {
    setFormData({
      name: fil.name,
      brand: fil.brand,
      type: fil.type,
      color: fil.color,
      weight: fil.weight,
      spoolCount: fil.spoolCount,
      price: fil.price
    });
    setEditingFilamentId(fil.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmId(id);
    setActiveMenuId(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const updated = filaments.filter(f => f.id !== deleteConfirmId);
      setFilaments(updated);
      setDeleteConfirmId(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedFilaments: Filament[];
    
    if (editingFilamentId) {
      updatedFilaments = filaments.map(f => f.id === editingFilamentId ? {
        ...f,
        name: formData.name || `${formData.brand} ${formData.type}`,
        brand: formData.brand || 'Bambu Lab',
        type: formData.type,
        color: formData.color,
        weight: formData.weight,
        price: formData.price,
        spoolCount: formData.spoolCount,
        lowStockThreshold: getThresholdForType(formData.type)
      } : f);
    } else {
      const filamentToAdd: Filament = {
        id: Date.now().toString(),
        name: formData.name || `${formData.brand} ${formData.type}`,
        brand: formData.brand || 'Bambu Lab',
        type: formData.type,
        weight: formData.weight,
        maxWeight: 1000,
        color: formData.color,
        price: formData.price,
        lowStockThreshold: getThresholdForType(formData.type),
        spoolCount: formData.spoolCount
      };
      updatedFilaments = [filamentToAdd, ...filaments];
    }

    setFilaments(updatedFilaments);
    setIsModalOpen(false);
    resetForm();
  };

  const filteredFilaments = filaments.filter(f => {
    const matchesType = filter === 'All' || f.type === filter;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalWeightFiltered = filteredFilaments.reduce((acc, curr) => acc + (curr.weight * curr.spoolCount), 0);
  const totalSpoolsFiltered = filteredFilaments.reduce((acc, curr) => acc + curr.spoolCount, 0);
  const lowStockCountFiltered = filteredFilaments.filter(f => f.weight < getThresholdForType(f.type)).length;
  const avgPriceFiltered = filteredFilaments.length > 0 
    ? filteredFilaments.reduce((acc, curr) => acc + curr.price, 0) / filteredFilaments.length 
    : 0;

  const globalTotalPrice = filaments.reduce((acc, curr) => acc + (curr.price * curr.spoolCount), 0);
  const globalTotalSpools = filaments.reduce((acc, curr) => acc + curr.spoolCount, 0);

  const getDynamicInsights = () => {
    const runningOut = filaments.filter(f => f.weight < getThresholdForType(f.type))
      .sort((a, b) => a.weight - b.weight);
    
    const insights = [];
    if (runningOut.length > 0) {
      runningOut.slice(0, 2).forEach(item => {
        insights.push({
          icon: 'warning',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          text: <span className="text-slate-400 font-medium leading-tight">
            <span className="font-bold text-white uppercase text-[10px] block mb-0.5">Stock Alert</span>
            <span className="font-bold text-slate-300">{item.name}</span> is low (<span className="text-red-500 font-bold">{item.weight}g</span>)
          </span>
        });
      });
    }

    if (filaments.length > 0) {
      const topMaterial = [...materialConfigs].sort((a, b) => {
        const countA = filaments.filter(f => f.type === a.type).length;
        const countB = filaments.filter(f => f.type === b.type).length;
        return countB - countA;
      })[0];

      if (topMaterial) {
        insights.push({
          icon: 'stars',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          text: <span className="text-slate-400 font-medium leading-tight">
            <span className="font-bold text-white uppercase text-[10px] block mb-0.5">Top Category</span>
            Most of your stock is <span className="font-bold text-primary">{topMaterial.type}</span>
          </span>
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        icon: 'verified',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        text: <span className="text-slate-400 font-medium">All filaments are currently well stocked!</span>
      });
    }

    return insights;
  };

  return (
    <div className="p-8 pb-20">
      <Header 
        title="Filament Inventory" 
        subtitle="Manage your materials and stock levels" 
        onAction={openAddModal} 
        actionIcon="add"
        showNotifications={false}
      />
      
      <div className="max-w-7xl mx-auto flex flex-col gap-8 mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-9 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="rounded-2xl p-6 bg-surface-dark/40 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Icon name="inventory_2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Weight</p>
                </div>
                <p className="text-2xl font-black text-white">{totalWeightFiltered}g</p>
              </div>
              
              <div className="rounded-2xl p-6 bg-surface-dark/40 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Icon name="payments" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Avg Price ({filter})</p>
                </div>
                <p className="text-2xl font-black text-white">€{avgPriceFiltered.toFixed(2)}</p>
              </div>

              <div className="rounded-2xl p-6 bg-surface-dark/40 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Icon name="spoke" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Active Spools</p>
                </div>
                <p className="text-2xl font-black text-white">{totalSpoolsFiltered}</p>
              </div>

              <div className={`rounded-2xl p-6 border shadow-sm transition-all flex flex-col justify-between ${lowStockCountFiltered > 0 ? 'bg-red-500/5 border-red-900/30' : 'bg-surface-dark/40 border-slate-800'}`}>
                <div className={`flex items-center gap-3 mb-2 ${lowStockCountFiltered > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <Icon name={lowStockCountFiltered > 0 ? 'warning' : 'check_circle'} />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Low Stock</p>
                </div>
                <p className="text-2xl font-black text-white">{lowStockCountFiltered}</p>
              </div>
            </div>

            <div className="bg-surface-dark/40 p-4 rounded-3xl border border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full">
                  {['All', ...materialConfigs.map(m => m.type)].map(mat => (
                    <button 
                      key={mat} 
                      onClick={() => setFilter(mat)}
                      className={`flex h-10 items-center px-6 rounded-xl transition-all shrink-0 ${
                        filter === mat 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-slate-900/50 dark:bg-slate-900/50 border border-slate-800 text-slate-400 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">{mat}</span>
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-md w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="search" />
                  </div>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600" 
                    placeholder="Search materials..." 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredFilaments.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-surface-dark/20 rounded-[3rem] border-2 border-dashed border-slate-800">
                  <Icon name="inventory_2" className="text-6xl text-slate-800 mb-4" />
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No filaments found</p>
                </div>
              ) : (
                filteredFilaments.map(fil => {
                  const threshold = getThresholdForType(fil.type);
                  const isLow = fil.weight < threshold;
                  const percentage = Math.round((fil.weight / fil.maxWeight) * 100);
                  const isMenuActive = activeMenuId === fil.id;

                  return (
                    <div key={fil.id} className={`flex flex-col gap-6 rounded-[2.5rem] bg-surface-dark/40 p-8 border ${isLow ? 'border-red-900/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' : 'border-slate-800'} shadow-sm hover:shadow-xl hover:border-slate-700 transition-all group relative overflow-hidden`}>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-xl text-white line-clamp-2 leading-tight flex-1">
                          {fil.name}
                        </h3>
                        <div className="relative shrink-0">
                          <button 
                            onClick={() => setActiveMenuId(isMenuActive ? null : fil.id)}
                            className="size-10 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-500 transition-colors"
                          >
                            <Icon name="more_horiz" className="text-2xl" />
                          </button>
                          
                          {isMenuActive && (
                            <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              <button 
                                onClick={() => openEditModal(fil)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-slate-800 text-slate-200 transition-colors text-left"
                              >
                                <Icon name="edit" className="text-lg text-primary" /> Edit Details
                              </button>
                              <button 
                                onClick={() => requestDelete(fil.id)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-red-900/20 text-red-500 transition-colors text-left"
                              >
                                <Icon name="delete" className="text-lg" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="relative size-24 shrink-0 rounded-3xl overflow-hidden shadow-inner border border-slate-800">
                          <div className="absolute inset-0 opacity-90" style={{ backgroundColor: fil.color }}></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                        </div>
                        <div className="flex flex-col flex-1 gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-primary tracking-tighter">{fil.price.toFixed(2)}€</span>
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{fil.type}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider">{fil.color}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Manufacturer</p>
                          <p className="font-black text-sm text-slate-200 truncate">{fil.brand}</p>
                        </div>
                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Quantity</p>
                          <p className="font-black text-sm text-slate-200">{fil.spoolCount} {fil.spoolCount === 1 ? 'Spool' : 'Spools'}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="h-2.5 rounded-full bg-slate-900/80 overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(19,164,236,0.3)]'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{percentage}% STOCK ({fil.weight}G)</span>
                          {isLow && (
                            <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1.5 animate-pulse">
                              <Icon name="error" className="text-xs" /> LOW
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="bg-surface-dark/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="font-black text-xl mb-8 flex items-center gap-3 text-primary">
                <Icon name="auto_awesome" /> Dynamic Insights
              </h3>
              <ul className="flex flex-col gap-6">
                {getDynamicInsights().map((insight, idx) => (
                  <li key={idx} className="flex gap-4 group items-start animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`size-10 rounded-2xl ${insight.bg} ${insight.color} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon name={insight.icon} className="text-xl" />
                    </div>
                    <div className="flex-1">{insight.text}</div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-primary text-white rounded-[3rem] p-10 shadow-2xl shadow-primary/30 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                <Icon name="inventory" className="text-[10rem]" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-10 opacity-80">
                  <Icon name="analytics" className="text-xl" />
                  <h3 className="font-black text-xs uppercase tracking-[0.2em]">Global Overview</h3>
                </div>
                
                <div className="flex flex-col gap-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Inventory Net Value</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black tracking-tighter">
                        {globalTotalPrice.toFixed(2)}
                      </span>
                      <span className="text-2xl font-black opacity-60">€</span>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-white/20 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Total spools</p>
                      <p className="text-3xl font-black leading-none">
                        {globalTotalSpools}
                      </p>
                    </div>
                    <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      <Icon name="precision_manufacturing" className="text-2xl" />
                    </div>
                  </div>
                </div>
              </div>
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
                  <Icon name={editingFilamentId ? 'edit' : 'add'} className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black leading-none text-white">{editingFilamentId ? 'Edit Filament' : 'New Material'}</h2>
                  <p className="text-sm text-slate-500 mt-1">{editingFilamentId ? 'Modify existing catalog entry' : 'Register a new material entry'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-500 transition-colors">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-10 flex flex-col gap-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Filament Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. PLA Basic Black"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Brand</label>
                  <input 
                    type="text" 
                    required
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Material Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer"
                  >
                    {materialConfigs.map(m => <option key={m.type} value={m.type}>{m.type}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Price per Unit (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Spool Count</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.spoolCount}
                    onChange={e => setFormData({...formData, spoolCount: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Weight (g)</label>
                  <input 
                    type="number" 
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Color Definition</label>
                  <div className="flex items-center gap-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 ring-1 ring-slate-800">
                      <input 
                        type="color" 
                        value={formData.color}
                        onChange={e => setFormData({...formData, color: e.target.value})}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer scale-150"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={formData.color}
                        onChange={e => setFormData({...formData, color: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all uppercase"
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
                  {editingFilamentId ? 'Update Record' : 'Add to Inventory'}
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
            <h2 className="text-3xl font-black mb-3 text-white">Confirm Delete</h2>
            <p className="text-slate-400 mb-10 font-medium leading-relaxed">
              This action cannot be undone. Are you sure you want to permanently remove this filament from the database?
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

export default Dashboard;
