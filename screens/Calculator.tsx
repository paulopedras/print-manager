
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Icon } from '../constants';
import { PricingConfig, Filament, MaterialComponent, Transaction } from '../types';
import { useAuth } from '../components/AuthContext';

interface FilamentUsage {
  filamentId: string;
  grams: number;
}

interface ComponentUsage {
  componentId: string;
  quantity: number;
}

interface PackagingItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

const Calculator: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [hardware, setHardware] = useState<MaterialComponent[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>({
    materialEfficiencyFactor: 1.1,
    laborHourlyRate: 5.0,
    printerCost: 450,
    additionalUpfrontCost: 0,
    annualMaintenance: 50,
    estimatedLifeYears: 5,
    estimatedUptimePercent: 10,
    avgPowerConsumptionW: 125,
    electricityCostKWh: 0.15,
    costBufferFactor: 1.3
  });

  const [partName, setPartName] = useState('Printed Part');
  const [partQuantity, setPartQuantity] = useState(1);
  const [selectedFilaments, setSelectedFilaments] = useState<FilamentUsage[]>([{ filamentId: '', grams: 100 }]);
  const [selectedComponents, setSelectedComponents] = useState<ComponentUsage[]>([]);
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(30);
  const [laborMinutes, setLaborMinutes] = useState(15);
  const [packagingItems, setPackagingItems] = useState<PackagingItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0.00);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [selectedSalePrice, setSelectedSalePrice] = useState<number | null>(null);
  const [selectedMargin, setSelectedMargin] = useState<number>(60);

  const PRICING_KEY = getStorageKey('pricingConfig');
  const FILAMENTS_KEY = getStorageKey('filaments_db');
  const HW_KEY = getStorageKey('hardware_db');
  const SALES_KEY = getStorageKey('sales_db');

  useEffect(() => {
    const savedPricing = localStorage.getItem(PRICING_KEY);
    if (savedPricing) setPricing(JSON.parse(savedPricing));

    const savedFilaments = localStorage.getItem(FILAMENTS_KEY);
    if (savedFilaments) {
      const parsed = JSON.parse(savedFilaments);
      setFilaments(parsed);
      if (parsed.length > 0 && selectedFilaments[0].filamentId === '') {
        setSelectedFilaments([{ filamentId: parsed[0].id, grams: 100 }]);
      }
    }

    const savedHardware = localStorage.getItem(HW_KEY);
    if (savedHardware) setHardware(JSON.parse(savedHardware));
  }, [PRICING_KEY, FILAMENTS_KEY, HW_KEY]);

  const getMachineRate = () => {
    const totalInvestment = pricing.printerCost + pricing.additionalUpfrontCost;
    const lifetimeMaintenance = pricing.annualMaintenance * pricing.estimatedLifeYears;
    const lifetimeCost = totalInvestment + lifetimeMaintenance;
    const annualUptimeHrs = 365 * 24 * (pricing.estimatedUptimePercent / 100);
    const totalLifetimeHrs = annualUptimeHrs * pricing.estimatedLifeYears;
    const capitalCostPerHr = totalLifetimeHrs > 0 ? lifetimeCost / totalLifetimeHrs : 0;
    const electricalCostPerHr = (pricing.avgPowerConsumptionW / 1000) * pricing.electricityCostKWh;
    return (capitalCostPerHr + electricalCostPerHr) * pricing.costBufferFactor;
  };

  const calculateResults = () => {
    const totalFilamentGrams = selectedFilaments.reduce((acc, curr) => acc + curr.grams, 0);
    const uniqueFilamentIds = Array.from(new Set(selectedFilaments.map(u => u.filamentId)));
    const selectedFilamentData = uniqueFilamentIds.map(id => filaments.find(f => f.id === id)).filter(Boolean);
    const avgFilamentPrice = selectedFilamentData.length > 0 
      ? selectedFilamentData.reduce((acc, curr) => acc + (curr?.price || 0), 0) / selectedFilamentData.length
      : 0;

    const partUnitCost = (totalFilamentGrams / 1000) * pricing.materialEfficiencyFactor * avgFilamentPrice;
    const totalPartCost = partUnitCost * partQuantity;

    let hardwareTotal = 0;
    const hardwareRows = selectedComponents.map(usage => {
      const c = hardware.find(item => item.id === usage.componentId);
      const unitCost = c ? c.price : 0;
      const total = unitCost * usage.quantity;
      hardwareTotal += total;
      return { ...usage, unitCost, total };
    });

    const totalMaterialsCost = totalPartCost + hardwareTotal;
    const laborCost = (laborMinutes / 60) * pricing.laborHourlyRate;
    let packagingTotal = 0;
    packagingItems.forEach(item => {
      packagingTotal += item.unitCost * item.quantity;
    });
    const totalPackShipCost = packagingTotal + shippingCost;
    const timeHrs = hours + (minutes / 60);
    const addedMachineCost = timeHrs * getMachineRate();

    const totalLandedCost = totalMaterialsCost + laborCost + totalPackShipCost + addedMachineCost;

    return {
      totalFilamentGrams,
      avgFilamentPrice,
      partUnitCost,
      totalPartCost,
      hardwareRows,
      hardwareTotal,
      totalMaterialsCost,
      laborCost,
      packagingTotal,
      totalPackShipCost,
      addedMachineCost,
      totalLandedCost,
      timeHrs,
      laborMinutes
    };
  };

  const results = calculateResults();
  const priceOptions = [
    { margin: 50, price: results.totalLandedCost / (1 - 0.5) },
    { margin: 60, price: results.totalLandedCost / (1 - 0.6) },
    { margin: 70, price: results.totalLandedCost / (1 - 0.7) },
  ];

  const addFilamentRow = () => filaments.length > 0 && setSelectedFilaments([...selectedFilaments, { filamentId: filaments[0].id, grams: 0 }]);
  const removeFilamentRow = (idx: number) => setSelectedFilaments(selectedFilaments.filter((_, i) => i !== idx));
  const updateFilamentRow = (idx: number, field: keyof FilamentUsage, val: any) => {
    const updated = [...selectedFilaments];
    updated[idx] = { ...updated[idx], [field]: val };
    setSelectedFilaments(updated);
  };

  const addComponentRow = () => hardware.length > 0 && setSelectedComponents([...selectedComponents, { componentId: hardware[0].id, quantity: 1 }]);
  const removeComponentRow = (idx: number) => setSelectedComponents(selectedComponents.filter((_, i) => i !== idx));
  const updateComponentRow = (idx: number, field: keyof ComponentUsage, val: any) => {
    const updated = [...selectedComponents];
    updated[idx] = { ...updated[idx], [field]: val };
    setSelectedComponents(updated);
  };

  const addPackagingRow = () => setPackagingItems([...packagingItems, { id: Date.now().toString(), name: '', quantity: 1, unitCost: 0 }]);
  const updatePackagingRow = (idx: number, field: keyof PackagingItem, val: any) => {
    const updated = [...packagingItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setPackagingItems(updated);
  };
  const removePackagingRow = (idx: number) => setPackagingItems(packagingItems.filter((_, i) => i !== idx));

  const handleRegisterSale = () => {
    setSelectedSalePrice(priceOptions[1].price);
    setSelectedMargin(60);
    setIsSaleModalOpen(true);
  };

  const confirmSale = () => {
    if (!buyerName.trim() || !selectedSalePrice) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      itemName: partName,
      customerName: buyerName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: selectedSalePrice,
      status: 'Paid',
      imageUrl: `https://picsum.photos/seed/${partName}/200`,
      type: 'Sale',
      details: {
        timeHrs: results.timeHrs,
        laborMins: results.laborMinutes,
        materialsCost: results.totalMaterialsCost,
        laborCost: results.laborCost,
        machineCost: results.addedMachineCost,
        packagingCost: results.totalPackShipCost,
        totalLandedCost: results.totalLandedCost,
        margin: selectedMargin
      }
    };

    const existingSalesString = localStorage.getItem(SALES_KEY);
    const existingSales = existingSalesString ? JSON.parse(existingSalesString) : [];
    localStorage.setItem(SALES_KEY, JSON.stringify([newTransaction, ...existingSales]));
    
    setIsSaleModalOpen(false);
    setBuyerName('');
  };

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto">
      <Header title="Price Calculator" subtitle="Precision Production Costing Sheet" showNotifications={false} />

      <div className="flex flex-col gap-10 mt-10">
        <section className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-[#13a4ec] p-4 text-white text-center">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Primary Production Inputs</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filament Selection</label>
              {selectedFilaments.map((usage, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select 
                    value={usage.filamentId}
                    onChange={e => updateFilamentRow(idx, 'filamentId', e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    {filaments.map(f => <option key={f.id} value={f.id}>{f.name} (€{f.price}/kg)</option>)}
                  </select>
                  <div className="relative w-28">
                    <input 
                      type="number" 
                      value={usage.grams}
                      onChange={e => updateFilamentRow(idx, 'grams', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-center"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black opacity-30">G</span>
                  </div>
                  {selectedFilaments.length > 1 && (
                    <button onClick={() => removeFilamentRow(idx)} className="text-red-400 hover:text-red-500 p-2">
                      <Icon name="remove_circle" className="text-xl" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addFilamentRow} className="text-[10px] font-black text-primary uppercase w-fit flex items-center gap-1 mt-2">
                <Icon name="add" className="text-sm" /> Add another filament
              </button>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Requirement</p>
                  <p className="text-xl font-black text-primary">{results.totalFilamentGrams}g</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Filament Cost</p>
                  <p className="text-xl font-black text-primary">€{results.avgFilamentPrice.toFixed(2)}<span className="text-xs opacity-50">/kg</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Print Time</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type="number" value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 font-black text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">HRS</span>
                  </div>
                  <div className="flex-1 relative">
                    <input type="number" max="59" value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 font-black text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">MIN</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Labor Required</label>
                <div className="relative">
                  <input type="number" value={laborMinutes} onChange={e => setLaborMinutes(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 font-black text-sm" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30 uppercase">Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-[#f2ead3] dark:bg-[#d2b48c]/20 p-4 text-[#a8875b] text-center border-b border-[#d2b48c]/10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Materials Input (Printed & Purchased)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Item Type</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-primary/5">
                  <td className="px-6 py-4 text-xs font-black uppercase text-primary">Printed Part</td>
                  <td className="px-6 py-4 font-bold text-sm">
                    <input 
                      value={partName} 
                      onChange={e => setPartName(e.target.value)} 
                      className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0" 
                    />
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-sm">
                    <input 
                      type="number" 
                      value={partQuantity} 
                      onChange={e => setPartQuantity(parseInt(e.target.value) || 0)} 
                      className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-12 text-center" 
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-400">€{results.partUnitCost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono font-black">€{results.totalPartCost.toFixed(2)}</td>
                </tr>
                {selectedComponents.map((usage, idx) => {
                  const comp = hardware.find(h => h.id === usage.componentId);
                  const rowTotal = (comp?.price || 0) * usage.quantity;
                  return (
                    <tr key={idx} className="group">
                      <td className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Hardware {idx + 1}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={usage.componentId}
                          onChange={e => updateComponentRow(idx, 'componentId', e.target.value)}
                          className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0 cursor-pointer"
                        >
                          <option value="" disabled>Select component...</option>
                          {hardware.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          value={usage.quantity} 
                          onChange={e => updateComponentRow(idx, 'quantity', parseInt(e.target.value) || 0)} 
                          className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-12 text-center" 
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">€{(comp?.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-black">
                        <div className="flex items-center justify-end gap-2">
                          €{rowTotal.toFixed(2)}
                          <button onClick={() => removeComponentRow(idx)} className="text-red-400 hover:text-red-500 transition-colors">
                            <Icon name="delete" className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={addComponentRow} className="text-[10px] font-black text-primary uppercase ml-2 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Icon name="playlist_add" className="text-xl" /> Add hardware part from inventory
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mr-4">Total Materials Cost:</span>
              <span className="text-2xl font-black text-[#a8875b]">€{results.totalMaterialsCost.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-[#cc5500] p-4 text-white text-center">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Total Labor Cost</h3>
          </div>
          <div className="p-8 flex justify-between items-center">
            <div className="text-xs text-slate-500 leading-relaxed max-w-md italic font-medium">
              Labor is calculated by multiplying total labor minutes by your hourly rate defined in Settings.
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cc5500] opacity-60 mb-1">Calculated Labor</p>
              <p className="text-4xl font-black">€{results.laborCost.toFixed(2)}</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-[#bf40bf] p-4 text-white text-center">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Packaging & Shipping Input</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {packagingItems.map((item, idx) => (
                  <tr key={item.id} className="group">
                    <td className="px-6 py-4">
                      <input 
                        value={item.name} 
                        onChange={e => updatePackagingRow(idx, 'name', e.target.value)} 
                        placeholder="(Insert name here)"
                        className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0 placeholder:opacity-30" 
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input type="number" value={item.quantity} onChange={e => updatePackagingRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-12 text-center" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input type="number" step="0.01" value={item.unitCost} onChange={e => updatePackagingRow(idx, 'unitCost', parseFloat(e.target.value) || 0)} className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-20 text-right" />
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black">
                       <div className="flex items-center justify-end gap-2">
                        €{(item.unitCost * item.quantity).toFixed(2)}
                        <button onClick={() => removePackagingRow(idx)} className="text-red-400 hover:text-red-500 transition-colors"><Icon name="close" className="text-xl" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-violet-50/10">
                  <td className="px-6 py-4 text-xs font-black uppercase text-violet-500">Average Shipping Cost (Postage)</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-right">
                    <input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-20 text-right" />
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-black text-violet-500">€{shippingCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={addPackagingRow} className="text-[10px] font-black text-violet-500 uppercase ml-2 flex items-center gap-1">
              <Icon name="add" className="text-sm" /> Add Packaging Row
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mr-4">Total Packaging Cost:</span>
              <span className="text-2xl font-black text-violet-500">€{results.totalPackShipCost.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4">
            <div className="bg-slate-100 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Added Machine Cost:</span>
              <span className="text-xl font-black text-slate-400 font-mono">€{results.addedMachineCost.toFixed(2)}</span>
            </div>
            <div className="bg-amber-500 p-10 rounded-[3rem] text-white shadow-2xl shadow-amber-500/30 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <Icon name="payments" className="text-[10rem]" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-4">Total Landed Cost</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black opacity-40">€</span>
                <span className="text-8xl font-black tracking-tighter">{results.totalLandedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600 text-center mb-4 italic">Suggested Pricing Based on Margin Target</h4>
            <div className="flex flex-col gap-4">
              {priceOptions.map(option => (
                <div key={option.margin} className="flex items-center justify-between p-6 bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 rounded-3xl group hover:scale-[1.02] transition-transform cursor-default">
                  <span className="text-xs font-black text-green-700 dark:text-green-500 uppercase tracking-widest">{option.margin}% Margin Price</span>
                  <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">€{option.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleRegisterSale}
          className="w-full py-8 bg-slate-900 text-primary font-black uppercase tracking-[0.4em] text-sm rounded-[2.5rem] border border-slate-800 hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-4 group"
        >
          <Icon name="point_of_sale" className="text-2xl group-hover:rotate-12 transition-transform" />
          REGISTER SALE
        </button>
      </div>

      {isSaleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-800 p-10">
            <div className="text-center mb-8">
              <div className="size-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Icon name="receipt_long" className="text-4xl" />
              </div>
              <h2 className="text-3xl font-black text-white">Register Final Sale</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Capture order details for your business history</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Buyer Name / Entity</label>
                <input 
                  type="text" 
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="e.g. Acme Corp or Jane Doe"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Selling Price</label>
                <div className="grid grid-cols-1 gap-3">
                  {priceOptions.map((option) => (
                    <button
                      key={option.margin}
                      onClick={() => {
                        setSelectedSalePrice(option.price);
                        setSelectedMargin(option.margin);
                      }}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                        selectedSalePrice === option.price 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedSalePrice === option.price ? 'text-white/70' : 'text-slate-500'}`}>
                          {option.margin}% Margin
                        </span>
                        <span className="font-black text-xl tracking-tighter">€{option.price.toFixed(2)}</span>
                      </div>
                      {selectedSalePrice === option.price && <Icon name="check_circle" className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setIsSaleModalOpen(false)} 
                className="flex-1 bg-slate-900 text-slate-400 font-black h-16 rounded-3xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSale}
                disabled={!buyerName.trim()}
                className="flex-[2] bg-primary text-white font-black h-16 rounded-3xl shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
