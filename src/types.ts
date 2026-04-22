export const SUPPORTED_YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'] as const;

export type Year = (typeof SUPPORTED_YEARS)[number];

export interface IKUData {
  id: string;
  category: string;
  ikuNum: string;
  indicator: string;
  unit: string;
  targets: Record<Year, string | number>;
  achievements?: Partial<Record<Year, string | number>>;
  updatedAt?: string;
}

export interface MasterYear {
  id: string;
  year: Year;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export enum SasaranProgram {
  Talenta = 'Talenta',
  Inovasi = 'Inovasi',
  Kontribusi = 'Kontribusi Keilmuan',
  TataKelola = 'Tata Kelola Institusi'
}
