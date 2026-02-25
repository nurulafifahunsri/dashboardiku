import { IKUData } from '../types';

const API_BASE = '/api/iku';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message = `Request gagal (${response.status})`;
    if (contentType.includes('application/json')) {
      const body = await response.json();
      if (body?.message) message = body.message;
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const ikuApi = {
  async fetchAll(): Promise<IKUData[]> {
    const res = await fetch(API_BASE);
    return handleResponse<IKUData[]>(res);
  },

  async create(payload: IKUData): Promise<IKUData> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<IKUData>(res);
  },

  async update(id: string, payload: IKUData): Promise<IKUData> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<IKUData>(res);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async importExcel(file: File): Promise<{ message: string; imported: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<{ message: string; imported: number }>(res);
  },

  exportExcel(): void {
    window.open(`${API_BASE}/export`, '_blank');
  },
};
