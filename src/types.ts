
export type Year = '2025' | '2026' | '2027' | '2028' | '2029' | '2030';

export interface IKUData {
  id: string;
  category: string;
  ikuNum: string;
  indicator: string;
  unit: string;
  targets: Record<Year, string | number>;
  achievements?: Partial<Record<Year, string | number>>;
}

export enum SasaranProgram {
  Talenta = 'Talenta',
  Inovasi = 'Inovasi',
  Kontribusi = 'Kontribusi Keilmuan',
  Masyarakat = 'Masyarakat',
  TataKelola = 'Tata Kelola Institusi'
}
