
import { IKUData, SasaranProgram } from './types';

export const ikuDataset: IKUData[] = [
  // IKU 1 - Talenta
  {
    id: '1-1',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Angka Efisiensi Edukasi PT (S1)',
    unit: '%',
    targets: { '2025': '49.7', '2026': '50', '2027': '51', '2028': '52', '2029': '53', '2030': '54' },
    achievements: { '2026': '42.5' } // Below target 50
  },
  {
    id: '1-2',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Angka Efisiensi Edukasi PT (S2)',
    unit: '%',
    targets: { '2025': '38.9', '2026': '40', '2027': '43', '2028': '45', '2029': '48', '2030': '50' },
    achievements: { '2026': '32.1' } // Below target 40
  },
  {
    id: '1-3',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Angka Efisiensi Edukasi PT (S3)',
    unit: '%',
    targets: { '2025': '30.6', '2026': '31', '2027': '32', '2028': '33', '2029': '34', '2030': '35' },
    achievements: { '2026': '25.4' } // Below target 31
  },
  {
    id: '1-4',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Persentase Mahasiswa Magister',
    unit: '%',
    targets: { '2025': '5', '2026': '6', '2027': '8', '2028': '10', '2029': '11', '2030': '12' },
    achievements: { '2026': '4.2' } // Below target 6
  },
  {
    id: '1-5',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Persentase Mahasiswa Doktor',
    unit: '%',
    targets: { '2025': '2', '2026': '2.5', '2027': '3', '2028': '4', '2029': '5', '2030': '6' },
    achievements: { '2026': '1.8' } // Below target 2.5
  },
  {
    id: '1-6',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 1',
    indicator: 'Persentase Mahasiswa Internasional',
    unit: '%',
    targets: { '2025': '0.05', '2026': '0.06', '2027': '0.1', '2028': '0.4', '2029': '0.8', '2030': '1' },
    achievements: { '2026': '0.03' } // Below target 0.06
  },
  {
    id: '2-1',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 2',
    indicator: 'Lulusan yang bekerja/wirausaha/studi lanjut',
    unit: '%',
    targets: { '2025': '71', '2026': '73', '2027': '75', '2028': '77', '2029': '78', '2030': '80' },
    achievements: { '2026': '62.0' } // Below target 73
  },
  {
    id: '3-1',
    category: SasaranProgram.Talenta,
    ikuNum: 'IKU 3',
    indicator: 'Mahasiswa berkegiatan di luar program studi',
    unit: '%',
    targets: { '2025': '14.9', '2026': '15.5', '2027': '18', '2028': '20', '2029': '25', '2030': '30' },
    achievements: { '2026': '11.4' } // Below target 15.5
  },
  // Inovasi
  {
    id: '4-1',
    category: SasaranProgram.Inovasi,
    ikuNum: 'IKU 4',
    indicator: 'Dosen yang mendapatkan rekognisi internasional',
    unit: '%',
    targets: { '2025': '37.33', '2026': '44.6', '2027': '48', '2028': '50', '2029': '52', '2030': '55' },
    achievements: { '2026': '38.2' } // Below target 44.6
  },
  {
    id: '4-2',
    category: SasaranProgram.Inovasi,
    ikuNum: 'IKU 4',
    indicator: 'Persentase dosen berpendidikan S3',
    unit: '%',
    targets: { '2025': '29.75', '2026': '30.1', '2027': '33', '2028': '35', '2029': '37', '2030': '40' },
    achievements: { '2026': '28.5' } // Below target 30.1
  },
  {
    id: '5-1',
    category: SasaranProgram.Inovasi,
    ikuNum: 'IKU 5',
    indicator: 'Luaran hasil kerjasama PT and startup/industri',
    unit: '%',
    targets: { '2025': '0.58', '2026': '5', '2027': '6', '2028': '7', '2029': '8', '2030': '10' },
    achievements: { '2026': '1.2' } // Below target 5
  },
  {
    id: '6-1',
    category: SasaranProgram.Inovasi,
    ikuNum: 'IKU 6',
    indicator: 'Publikasi bereputasi internasional (Scopus/WoS)',
    unit: 'Artikel',
    targets: { '2025': '590', '2026': '620', '2027': '682', '2028': '764', '2029': '871', '2030': '1010' },
    achievements: { '2026': '485' } // Below target 620
  },
  {
    id: '6-2',
    category: SasaranProgram.Inovasi,
    ikuNum: 'IKU 6',
    indicator: 'Persentase publikasi Q1',
    unit: '%',
    targets: { '2025': '31.5', '2026': '32', '2027': '33', '2028': '35', '2029': '38', '2030': '42' },
    achievements: { '2026': '28.3' } // Below target 32
  },
  // Kontribusi
  {
    id: '7-1',
    category: SasaranProgram.Kontribusi,
    ikuNum: 'IKU 7',
    indicator: 'Keterlibatan PT dalam SDG (1, 4, 17, dll)',
    unit: '%',
    targets: { '2025': '30', '2026': '38', '2027': '45', '2028': '55', '2029': '70', '2030': '80' },
    achievements: { '2026': '22.0' } // Below target 38
  },
  {
    id: '7-2',
    category: SasaranProgram.Kontribusi,
    ikuNum: 'IKU 7',
    indicator: 'Peringkat QS World University Ranking',
    unit: 'Peringkat',
    targets: { '2025': '601-800', '2026': '601-800', '2027': '401-600', '2028': '401-600', '2029': '301-400', '2030': '301-400' },
    achievements: { '2026': '801-1000' } // Below target 601-800
  },
  // Masyarakat & Tata Kelola
  {
    id: '8-1',
    category: SasaranProgram.Masyarakat,
    ikuNum: 'IKU 8',
    indicator: 'SDM PT yang terlibat penyusunan kebijakan',
    unit: '%',
    targets: { '2025': '5', '2026': '8', '2027': '14', '2028': '20', '2029': '22', '2030': '25' },
    achievements: { '2026': '3.5' } // Below target 8
  },
  {
    id: '9-1',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 9',
    indicator: 'Pendapatan non-pendidikan/UKT vs Total',
    unit: '%',
    targets: { '2025': '13.3', '2026': '15', '2027': '18', '2028': '20', '2029': '22', '2030': '25' },
    achievements: { '2026': '10.2' } // Below target 15
  },
  {
    id: '9-2',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 9',
    indicator: 'Dana abadi terhadap total aset',
    unit: '%',
    targets: { '2025': '0.04', '2026': '0.75', '2027': '1', '2028': '1.5', '2029': '2', '2030': '3' },
    achievements: { '2026': '0.05' } // Below target 0.75
  },
  {
    id: '9-3',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 9',
    indicator: 'Alokasi pendapatan dana masyarakat: Riset',
    unit: '%',
    targets: { '2025': '10.3', '2026': '11.5', '2027': '12.5', '2028': '13.5', '2029': '14.5', '2030': '15' },
    achievements: { '2026': '9.1' } // Below target 11.5
  },
  {
    id: '10-1',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 10',
    indicator: 'Jumlah unit Zona Integritas - WBK/WBBM',
    unit: 'Unit',
    targets: { '2025': '1', '2026': '1', '2027': '1', '2028': '1', '2029': '1', '2030': '2' },
    achievements: { '2026': '0' } // Below target 1
  },
  {
    id: '11-1',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 11',
    indicator: 'Opini WTP atas laporan keuangan PT',
    unit: 'Opini',
    targets: { '2025': 'WTP', '2026': 'WTP', '2027': 'WTP', '2028': 'WTP', '2029': 'WTP', '2030': 'WTP' },
    achievements: { '2026': 'WDP' } // Below target WTP
  },
  {
    id: '11-2',
    category: SasaranProgram.TataKelola,
    ikuNum: 'IKU 11',
    indicator: 'Predikat SAKIP perguruan tinggi',
    unit: 'Nilai',
    targets: { '2025': 'A', '2026': 'A', '2027': 'A', '2028': 'A', '2029': 'A', '2030': 'AA' },
    achievements: { '2026': 'B' } // Below target A
  }
];
