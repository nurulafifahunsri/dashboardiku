export const DEFAULT_YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'] as const;

export type Year = string;

export interface IKUDocument {
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
}

export interface ChartColorConfig {
  categories: Record<SasaranProgram, string>;
  target: string;
  realization: string;
}

export interface IKUData {
  id: string;
  category: string;
  ikuNum: string;
  indicator: string;
  unit: string;
  targets: Partial<Record<Year, string | number>>;
  achievements?: Partial<Record<Year, string | number>>;
  documents?: Partial<Record<Year, IKUDocument>>;
  updatedAt?: string;
}

export interface MasterYear {
  id: string;
  year: Year;
  label: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  chartColors?: ChartColorConfig;
}

export enum SasaranProgram {
  Talenta = 'Talenta',
  Inovasi = 'Inovasi',
  Kontribusi = 'Kontribusi Keilmuan',
  TataKelola = 'Tata Kelola Institusi'
}
