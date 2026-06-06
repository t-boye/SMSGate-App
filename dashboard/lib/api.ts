const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://sms-gate-app.vercel.app';

export async function apiFetch(path: string, options?: RequestInit, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (data: { email: string; name: string; password: string }) =>
    apiFetch('/api/v1/users/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch('/api/v1/users/login', { method: 'POST', body: JSON.stringify(data) }),

  me: (token: string) => apiFetch('/api/v1/users/me', {}, token),

  usage: (token: string) => apiFetch('/api/v1/users/me/usage', {}, token),

  devices: (token: string) => apiFetch('/api/v1/devices', {}, token),

  createDevice: (token: string, data: { name: string; login: string; password: string }) =>
    apiFetch('/api/v1/devices', { method: 'POST', body: JSON.stringify(data) }, token),

  deleteDevice: (token: string, id: string) =>
    apiFetch(`/api/v1/devices/${id}`, { method: 'DELETE' }, token),

  apiKeys: (token: string) => apiFetch('/api/v1/keys', {}, token),

  createApiKey: (token: string, name: string) =>
    apiFetch('/api/v1/keys', { method: 'POST', body: JSON.stringify({ name }) }, token),

  deleteApiKey: (token: string, key: string) =>
    apiFetch(`/api/v1/keys/${key}`, { method: 'DELETE' }, token),

  messages: (token: string, limit = 50) =>
    apiFetch(`/api/v1/messages?limit=${limit}`, {}, token),

  sendMessage: (token: string, data: {
    message: string;
    phoneNumbers: string[];
    deviceId?: string;
    simNumber?: number;
  }) => apiFetch('/api/v1/messages', { method: 'POST', body: JSON.stringify(data) }, token),

  plans: () => apiFetch('/api/v1/paystack/plans'),

  initializePayment: (token: string, plan: string) =>
    apiFetch('/api/v1/paystack/initialize', { method: 'POST', body: JSON.stringify({ plan }) }, token),

  verifyPayment: (token: string, reference: string) =>
    apiFetch('/api/v1/paystack/verify', { method: 'POST', body: JSON.stringify({ reference }) }, token),

  updateProfile: (token: string, data: { name: string }) =>
    apiFetch('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(data) }, token),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    apiFetch('/api/v1/users/me/password', { method: 'POST', body: JSON.stringify(data) }, token),
};

export const API_BASE = API;
