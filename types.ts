
export interface User {
  id: string;
  username: string;
}

export interface Filament {
  id: string;
  name: string;
  brand: string;
  type: string;
  weight: number;
  maxWeight: number;
  color: string;
  price: number;
  lowStockThreshold: number;
  spoolCount: number;
}

export interface MaterialComponent {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Transaction {
  id: string;
  itemName: string;
  customerName: string;
  date: string;
  amount: number;
  status: 'Requested' | 'Paid' | 'Pending' | 'Delivered' | 'Done' | 'Cancelled';
  imageUrl: string;
  type?: string;
  details?: {
    timeHrs: number;
    laborMins: number;
    materialsCost: number;
    laborCost: number;
    machineCost: number;
    packagingCost: number;
    totalLandedCost: number;
    margin: number;
  };
}

export interface MaterialConfig {
  type: string;
  threshold: number;
}

export interface PricingConfig {
  materialEfficiencyFactor: number;
  laborHourlyRate: number;
  printerCost: number;
  additionalUpfrontCost: number;
  annualMaintenance: number;
  estimatedLifeYears: number;
  estimatedUptimePercent: number;
  avgPowerConsumptionW: number;
  electricityCostKWh: number;
  costBufferFactor: number;
}

export interface AppSettings {
  materials: MaterialConfig[];
}
