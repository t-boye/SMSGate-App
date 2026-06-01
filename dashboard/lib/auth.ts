'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smsgate_token');
}

export function setToken(token: string) {
  localStorage.setItem('smsgate_token', token);
}

export function clearToken() {
  localStorage.removeItem('smsgate_token');
  localStorage.removeItem('smsgate_user');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('smsgate_user') ?? 'null'); } catch { return null; }
}

export function setUser(user: any) {
  localStorage.setItem('smsgate_user', JSON.stringify(user));
}
