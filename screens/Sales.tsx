
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Transaction } from '../types';
import { Icon } from '../constants';
import { useAuth } from '../components/AuthContext';

const Sales: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ amount: 0, status: '' as Transaction['status'] });

  const SALES_KEY = getStorageKey('sales_db');

  useEffect(() => {
    const savedSales = localStorage.getItem(SALES_KEY);
    if (savedSales) {
      setTransactions(JSON.parse(savedSales));
    } else {
      setTransactions([]);
    }
  }, [SALES_KEY]);

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem(SALES_KEY, JSON.stringify(updated));
  };

  const handleRowClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation(); 
    setSelectedTx(tx);
    setEditFormData({ amount: tx.amount, status: tx.status });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    const updated = transactions.map(t => t.id === selectedTx.id ? {
      ...t,
      amount: editFormData.amount,
      status: editFormData.status
    } : t);

    saveTransactions(updated);
    setIsEditModalOpen(false);
  };

  const statusOptions: Transaction['status'][] = ['Requested', 'Paid', 'Delivered', 'Done', 'Cancelled'];

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'Requested': return 'bg-blue-100 text-blue-700';
      case 'Paid': return 'bg-[#dcfce7] text-[#166534]';
      case 'Delivered': return 'bg-purple-100 text-purple-700';
      case 'Done': return 'bg-[#dcfce7] text-[#166534]';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateRealizedMargin = (amount: number, landedCost: number) => {
    if (amount <= 0) return 0;
    return ((amount - landedCost) / amount) * 100;
  };

  const doneTransactions = transactions.filter(t => t.status === 'Done');
  const totalRevenue = doneTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalProfit = doneTransactions.reduce((acc, curr) => {
    const landed = curr.details?.totalLandedCost || 0;
    return acc + (curr.amount - landed);
  }, 0);
  const avgOrderValue = doneTransactions.length > 0 ? totalRevenue / doneTransactions.length : 0;
  const revenueForMargin = doneTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const realizedMarginWeighted = revenueForMargin > 0 ? (totalProfit / revenueForMargin) * 100 : 0;

  return (
    <div className="p-8 pb-32">
      <Header 
        title="Sales History" 
        subtitle={`Viewing ${transactions.length} total transactions • ${doneTransactions.length} completed`} 
        showNotifications={false} 
      />
      
      <div className="max-w-7xl mx-auto flex flex-col gap-10 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-[2.5rem] p-8 bg-[#1a2c35]/60 border border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Icon name="payments" className="text-7xl" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Total Revenue</p>
            <p className="text-4xl font-black tracking-tighter text-white mb-4">€{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-black text-[10px] uppercase">Based on completed orders</span>
            </div>
          </div>

          <div className="rounded-[2.5rem] p-8 bg-[#1a2c35]/60 border border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Icon name="trending_up" className="text-7xl" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Total Net Profit</p>
            <p className={`text-4xl font-black tracking-tighter mb-4 ${totalProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
              €{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-primary font-black text-[10px] uppercase">Revenue - Landed Costs</span>
            </div>
          </div>

          <div className="rounded-[2.5rem] p-8 bg-[#1a2c35]/60 border border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Icon name="monitoring" className="text-7xl" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Avg. Order Value</p>
            <p className="text-4xl font-black tracking-tighter text-white mb-4">€{avgOrderValue.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-black text-[10px] uppercase">Per completed sale</span>
            </div>
          </div>

          <div className="rounded-[2.5rem] p-8 bg-[#1a2c35]/60 border border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Icon name="analytics" className="text-7xl" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Realized Margin</p>
            <p className={`text-4xl font-black tracking-tighter mb-4 ${realizedMarginWeighted >= 0 ? 'text-white' : 'text-red-500'}`}>
              {realizedMarginWeighted.toFixed(1)}%
            </p>
            <div className="flex items-center gap-2">
              <span className="text-violet-400 font-black text-[10px] uppercase">Weighted business margin</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a2c35]/60 rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-800/50 flex justify-between items-center bg-[#1a2c35]/40">
            <h3 className="text-xl font-black flex items-center gap-3 text-white">
              <Icon name="history" className="text-primary text-2xl" /> Transaction Ledger
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-10 py-6">Product / Service</th>
                  <th className="px-10 py-6">Customer</th>
                  <th className="px-10 py-6 text-center">Date</th>
                  <th className="px-10 py-6">Amount</th>
                  <th className="px-10 py-6">Realized Margin</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-10 py-20 text-center">
                      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No records found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const marginValue = tx.details 
                      ? calculateRealizedMargin(tx.amount, tx.details.totalLandedCost)
                      : null;

                    return (
                      <tr key={tx.id} onClick={() => handleRowClick(tx)} className="hover:bg-slate-800/20 transition-colors group cursor-pointer border-t border-slate-800/30 first:border-t-0">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <img src={tx.imageUrl} className="size-16 rounded-2xl object-cover shadow-inner border border-slate-800" alt="" />
                            <span className="font-black text-lg">{tx.itemName}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-slate-400 font-bold">{tx.customerName}</td>
                        <td className="px-10 py-6 text-slate-500 font-mono text-xs text-center">{tx.date}</td>
                        <td className="px-10 py-6">
                          <span className="text-xl font-black">€{tx.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-10 py-6">
                          {marginValue !== null ? (
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-sm font-black ${marginValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {marginValue.toFixed(1)}%
                              </span>
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Current</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-bold">N/A</span>
                          )}
                        </td>
                        <td className="px-10 py-6">
                          <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={(e) => handleEditClick(e, tx)}
                            className="size-10 rounded-xl bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all flex items-center justify-center"
                          >
                            <Icon name="edit" className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1a2c35] w-full max-w-md rounded-[3.5rem] border border-slate-800 p-10 shadow-2xl">
            <div className="text-center mb-8">
               <h2 className="text-2xl font-black text-white">Update Sale Information</h2>
               <p className="text-sm text-slate-500 mt-1">Cost calculations are fixed based on calculation time.</p>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selling Price (€)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editFormData.amount} 
                    onChange={e => setEditFormData({...editFormData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[#101c22] border border-slate-800 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-primary" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">€</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Workflow Status</label>
                <div className="relative">
                  <select 
                    value={editFormData.status} 
                    onChange={e => setEditFormData({...editFormData, status: e.target.value as any})}
                    className="w-full bg-[#101c22] border border-slate-800 rounded-2xl px-6 py-4 text-white font-black outline-none appearance-none cursor-pointer"
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Icon name="expand_more" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 h-16 bg-slate-900 text-slate-400 font-black rounded-3xl uppercase tracking-widest text-xs transition-all hover:bg-slate-800">Discard</button>
                <button type="submit" className="flex-[2] h-16 bg-primary text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1a2c35] w-full max-w-2xl rounded-[3.5rem] border border-slate-800 p-10 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className={`size-16 rounded-2xl flex items-center justify-center ${selectedTx.type === 'Sale' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-500'} border border-slate-800 shadow-inner`}>
                  <Icon name={selectedTx.type === 'Sale' ? 'receipt_long' : 'inventory_2'} className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedTx.itemName}</h2>
                  <p className="text-sm text-slate-500 font-medium">Record ID: {selectedTx.id}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="size-12 rounded-2xl hover:bg-slate-800 text-slate-500 transition-colors flex items-center justify-center">
                <Icon name="close" />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-8 no-scrollbar">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#101c22] p-5 rounded-3xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-black ${getStatusColor(selectedTx.status).split(' ')[1]}`}>{selectedTx.status}</p>
                </div>
                <div className="bg-[#101c22] p-5 rounded-3xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Selling Amount</p>
                  <p className="text-xl font-black text-white">€{selectedTx.amount.toFixed(2)}</p>
                </div>
                <div className="bg-[#101c22] p-5 rounded-3xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Realized Profit</p>
                  <p className="text-xl font-black text-green-500">
                    €{(selectedTx.amount - (selectedTx.details?.totalLandedCost || 0)).toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedTx.details ? (
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Icon name="query_stats" className="text-lg" /> Production Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Time (Machine)</p>
                      <p className="text-lg font-black text-white">{selectedTx.details.timeHrs.toFixed(1)} <span className="text-xs opacity-50">HRS</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Time (Labor)</p>
                      <p className="text-lg font-black text-white">{selectedTx.details.laborMins} <span className="text-xs opacity-50">MINS</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Material Costs</p>
                      <p className="text-lg font-black text-white">€{selectedTx.details.materialsCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Labor Cost</p>
                      <p className="text-lg font-black text-white">€{selectedTx.details.laborCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Electricity/Deprec.</p>
                      <p className="text-lg font-black text-white">€{selectedTx.details.machineCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Packaging/Ship</p>
                      <p className="text-lg font-black text-white">€{selectedTx.details.packagingCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 flex justify-between items-center shadow-inner">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Total Landed Cost</p>
                      <p className="text-3xl font-black text-white">€{selectedTx.details.totalLandedCost.toFixed(2)}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Realized Margin</p>
                      <p className="text-2xl font-black text-white">
                        {calculateRealizedMargin(selectedTx.amount, selectedTx.details.totalLandedCost).toFixed(1)}%
                      </p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Calculated based on current selling price</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800">
                   <Icon name="info" className="text-4xl text-slate-600 mb-2" />
                   <p className="text-slate-500 font-bold text-sm">No production costing details stored for this record.</p>
                </div>
              )}
            </div>
            <button onClick={() => setIsDetailsModalOpen(false)} className="mt-8 w-full h-16 bg-slate-900 text-white font-black rounded-3xl uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-[0.98]">
              Close Detail View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
