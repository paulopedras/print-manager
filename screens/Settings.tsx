
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Icon } from '../constants';
import { MaterialConfig, PricingConfig } from '../types';
import { useAuth } from '../components/AuthContext';

const Settings: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [materials, setMaterials] = useState<MaterialConfig[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeThreshold, setNewTypeThreshold] = useState(200);
  const [hardwareThreshold, setHardwareThreshold] = useState(3);

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

  const CONFIGS_KEY = getStorageKey('materialConfigs');
  const HW_THRESHOLD_KEY = getStorageKey('hardwareThreshold');
  const PRICING_KEY = getStorageKey('pricingConfig');

  useEffect(() => {
    const savedMaterials = localStorage.getItem(CONFIGS_KEY);
    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    } else {
      const defaultMaterials = [
        { type: 'PLA', threshold: 200 },
        { type: 'PETG', threshold: 200 },
        { type: 'ABS', threshold: 200 },
        { type: 'TPU', threshold: 100 },
        { type: 'ASA', threshold: 200 }
      ];
      setMaterials(defaultMaterials);
      localStorage.setItem(CONFIGS_KEY, JSON.stringify(defaultMaterials));
    }
    
    const savedHw = localStorage.getItem(HW_THRESHOLD_KEY);
    if (savedHw) setHardwareThreshold(parseInt(savedHw));

    const savedPricing = localStorage.getItem(PRICING_KEY);
    if (savedPricing) setPricing(JSON.parse(savedPricing));
  }, [CONFIGS_KEY, HW_THRESHOLD_KEY, PRICING_KEY]);

  const saveMaterials = (updated: MaterialConfig[]) => {
    setMaterials(updated);
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(updated));
  };

  const addMaterialType = () => {
    if (!newTypeName.trim()) return;
    const typeUpper = newTypeName.trim().toUpperCase();
    if (materials.some(m => m.type.toUpperCase() === typeUpper)) return;
    
    const updated = [...materials, { type: typeUpper, threshold: newTypeThreshold }];
    saveMaterials(updated);
    setNewTypeName('');
    setNewTypeThreshold(200);
  };

  const removeMaterialType = (type: string) => {
    const updated = materials.filter(m => m.type !== type);
    saveMaterials(updated);
  };

  const updateMaterialThreshold = (type: string, threshold: number) => {
    const updated = materials.map(m => m.type === type ? { ...m, threshold } : m);
    saveMaterials(updated);
  };

  const savePricing = (newConfig: PricingConfig) => {
    setPricing(newConfig);
    localStorage.setItem(PRICING_KEY, JSON.stringify(newConfig));
  };

  const updatePricingField = (field: keyof PricingConfig, value: number) => {
    savePricing({ ...pricing, [field]: value });
  };

  const totalInvestment = pricing.printerCost + pricing.additionalUpfrontCost;
  const lifetimeCost = totalInvestment + (pricing.annualMaintenance * pricing.estimatedLifeYears);
  const annualUptimeHrs = 365 * 24 * (pricing.estimatedUptimePercent / 100);
  const totalLifetimeHrs = annualUptimeHrs * pricing.estimatedLifeYears;
  const capitalCostPerHr = totalLifetimeHrs > 0 ? lifetimeCost / totalLifetimeHrs : 0;
  const electricalCostPerHr = (pricing.avgPowerConsumptionW / 1000) * pricing.electricityCostKWh;
  const machineRate = (capitalCostPerHr + electricalCostPerHr) * pricing.costBufferFactor;

  return (
    <div className="p-8 pb-32">
      <Header title="Settings" subtitle="Fine-tune your inventory behavior and pricing precision" />
      
      <div className="max-w-5xl mx-auto flex flex-col gap-10 mt-10">
        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-10">
          <div className="flex items-center gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="size-14 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center">
              <Icon name="calculate" className="text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black">Advanced Inputs</h3>
              <p className="text-sm text-slate-500 italic">Configure high-precision manufacturing metrics</p>
            </div>
          </div>

          <div className="flex flex-col gap-12">
            <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 w-40">Value</th>
                    <th className="px-6 py-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-6 py-4 font-black text-sm">Material Efficiency Factor</td>
                    <td className="px-6 py-4">
                      <input type="number" step="0.1" value={pricing.materialEfficiencyFactor} onChange={e => updatePricingField('materialEfficiencyFactor', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 leading-relaxed">Multiplier for taking printing in-efficiencies into account. By default this number is 1.1 (110%)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-black text-sm bg-primary/5 text-primary">Print Time Rate (€/hr)</td>
                    <td className="px-6 py-4 bg-primary/5">
                       <span className="text-lg font-black text-primary">€{machineRate.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 leading-relaxed">The estimated value of your 3D printer on an hourly basis. Computed from the machine cost calculation below.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-black text-sm">Labor Hourly Rate (€/hr)</td>
                    <td className="px-6 py-4">
                      <input type="number" value={pricing.laborHourlyRate} onChange={e => updatePricingField('laborHourlyRate', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 leading-relaxed">Assumed cost of labor for post processing, print farm management, and fulfillment.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-lg font-black text-slate-400 italic text-center uppercase tracking-[0.2em] mb-4">Print Time Rate (Machine Cost) Calculation</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Printer Cost (€)</div>
                  <div className="col-span-2">
                    <input type="number" value={pricing.printerCost} onChange={e => updatePricingField('printerCost', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">Total cost spent to purchase the 3D printer (includes shipping and taxes)</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Additional Upfront Cost (€)</div>
                  <div className="col-span-2">
                    <input type="number" value={pricing.additionalUpfrontCost} onChange={e => updatePricingField('additionalUpfrontCost', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">To include any upgrades done to the printer upon putting into service.</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center opacity-60">
                  <div className="col-span-4 text-sm font-bold">Total Investment (€)</div>
                  <div className="col-span-2 font-mono text-sm font-black">€{totalInvestment}</div>
                  <div className="col-span-6 text-[10px] uppercase font-black text-slate-400">Calculated value</div>
                </div>

                <hr className="my-4 border-slate-100 dark:border-slate-800" />

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Estimated Annual Maintenance (€)</div>
                  <div className="col-span-2">
                    <input type="number" value={pricing.annualMaintenance} onChange={e => updatePricingField('annualMaintenance', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">Estimated cost of upkeep and repair spent per year. Default is ~10% of printer cost.</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center opacity-60">
                  <div className="col-span-4 text-sm font-bold">Lifetime Cost (€)</div>
                  <div className="col-span-2 font-mono text-sm font-black">€{lifetimeCost.toFixed(2)}</div>
                  <div className="col-span-6 text-[10px] uppercase font-black text-slate-400">Total spent on printer for duration of it's life</div>
                </div>

                <hr className="my-4 border-slate-100 dark:border-slate-800" />

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Estimated Life (yrs)</div>
                  <div className="col-span-2">
                    <input type="number" value={pricing.estimatedLifeYears} onChange={e => updatePricingField('estimatedLifeYears', parseInt(e.target.value) || 1)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">Most hobbyist 3D Printers last 3-7 years. Print farm machines last less.</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Estimated Uptime (%)</div>
                  <div className="col-span-2">
                    <input type="number" min="1" max="100" value={pricing.estimatedUptimePercent} onChange={e => updatePricingField('estimatedUptimePercent', parseInt(e.target.value) || 1)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">Percentage of hours the printer is running on average over a year. 50% is very busy.</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center opacity-60">
                  <div className="col-span-4 text-sm font-bold">Estimated Uptime (hrs/yr)</div>
                  <div className="col-span-2 font-mono text-sm font-black">{Math.round(annualUptimeHrs)}</div>
                  <div className="col-span-6 text-[10px] uppercase font-black text-slate-400">Calculated value</div>
                </div>

                <hr className="my-4 border-slate-100 dark:border-slate-800" />

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Average Power Consumption (W)</div>
                  <div className="col-span-2">
                    <input type="number" value={pricing.avgPowerConsumptionW} onChange={e => updatePricingField('avgPowerConsumptionW', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">FDM printers draw 60W-300W. Average should be around 150W.</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm font-bold">Electricity Cost (€/KWh)</div>
                  <div className="col-span-2">
                    <input type="number" step="0.01" value={pricing.electricityCostKWh} onChange={e => updatePricingField('electricityCostKWh', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-6 text-xs text-slate-500">Average rate per KWh in your region. Adjust accordingly.</div>
                </div>

                <hr className="my-6 border-slate-100 dark:border-slate-800" />

                <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h5 className="text-center font-black uppercase tracking-widest text-slate-400 text-[10px] mb-8">Print Time Rate Calculation Results</h5>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-12 gap-4 items-center opacity-60">
                      <div className="col-span-4 text-xs font-bold">Printer Capital Cost per hour (€/hr)</div>
                      <div className="col-span-2 font-mono text-xs font-black">€{capitalCostPerHr.toFixed(2)}</div>
                      <div className="col-span-6 text-[8px] uppercase font-black text-slate-400">Calculated Value</div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center opacity-60">
                      <div className="col-span-4 text-xs font-bold">Printer Electrical Cost per hour (€/hr)</div>
                      <div className="col-span-2 font-mono text-xs font-black">€{electricalCostPerHr.toFixed(2)}</div>
                      <div className="col-span-6 text-[8px] uppercase font-black text-slate-400">Calculated Value</div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 text-sm font-bold">Printer Cost Buffer Factor</div>
                      <div className="col-span-2">
                        <input type="number" step="0.1" value={pricing.costBufferFactor} onChange={e => updatePricingField('costBufferFactor', parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                      </div>
                      <div className="col-span-6 text-xs text-slate-500">Multiplies total printer cost per hour to account for unforeseen expenses and depreciation.</div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="col-span-4 text-lg font-black text-primary">Total Printer Cost per hour (€/hr)</div>
                      <div className="col-span-2 font-mono text-2xl font-black text-primary">€{machineRate.toFixed(2)}</div>
                      <div className="col-span-6 text-xs text-slate-500 italic">Sum of printer capital and electrical cost and multiplying by the buffer factor</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="size-14 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
              <Icon name="palette" className="text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black">Filament Configuration</h3>
              <p className="text-sm text-slate-500">Manage material types and individual low-stock thresholds</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 dark:bg-background-dark/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Name</label>
                <input 
                  type="text" 
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="e.g. ASA-CF"
                  className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert threshold (g)</label>
                <input 
                  type="number" 
                  value={newTypeThreshold}
                  onChange={e => setNewTypeThreshold(parseInt(e.target.value) || 0)}
                  className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <button 
                onClick={addMaterialType}
                className="h-[46px] bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Icon name="add" className="text-lg" /> Add Material
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {materials.map((m) => (
                <div key={m.type} className="flex items-center justify-between p-5 bg-white dark:bg-background-dark/20 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-24 px-4 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-center border border-primary/10">
                      {m.type}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Low-Stock Notification Point</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={m.threshold}
                          onChange={(e) => updateMaterialThreshold(m.type, parseInt(e.target.value) || 0)}
                          className="w-24 bg-transparent border-none p-0 text-sm font-black text-primary focus:ring-0"
                        />
                        <span className="text-[10px] font-bold text-slate-400">GRAMS</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeMaterialType(m.type)}
                    className="size-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="delete" />
                  </button>
                </div>
              ))}
              {materials.length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No material types configured</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="size-14 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
              <Icon name="construction" className="text-3xl" />
            </div>
            <div>
              <h3 className="text-xl font-black">Hardware Inventory Limits</h3>
              <p className="text-sm text-slate-500">Manage stock thresholds for components and small parts</p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-background-dark/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h4 className="font-black text-sm uppercase tracking-widest mb-1">Global Stock Alert</h4>
              <p className="text-xs text-slate-500">Triggers 'LOW STOCK' alerts in the components view if units fall below this value.</p>
            </div>
            <div className="w-full md:w-32">
              <input 
                type="number" 
                value={hardwareThreshold}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  setHardwareThreshold(val);
                  localStorage.setItem(HW_THRESHOLD_KEY, val.toString());
                }}
                className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-center text-lg font-black"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
