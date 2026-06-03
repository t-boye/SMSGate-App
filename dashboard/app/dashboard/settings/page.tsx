'use client';
import { useEffect, useState } from 'react';
import { getToken, getUser, setUser as saveUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className}`} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', disabled = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-green-500/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-md)' }}
      />
    </div>
  );
}

type Toast = { type: 'success' | 'error'; msg: string };

export default function SettingsPage() {
  const [me, setMe]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken()!;

  useEffect(() => {
    api.me(token).then(setMe).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl space-y-5">
      <Skeleton className="h-6 w-32 mb-1" />
      <Skeleton className="h-4 w-56" />
      <Card className="p-5 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i}><Skeleton className="h-3 w-20 mb-1.5" /><Skeleton className="h-9" /></div>)}
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <ProfileSection token={token} me={me} onUpdate={(updated: any) => { setMe((m: any) => ({ ...m, user: { ...m.user, ...updated } })); saveUser({ ...getUser(), ...updated }); }} />
      <PasswordSection token={token} />
      <PlanSection me={me} />
    </div>
  );
}

function ProfileSection({ token, me, onUpdate }: { token: string; me: any; onUpdate: (u: any) => void }) {
  const [name, setName]     = useState(me?.user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<Toast | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setToast(null);
    try {
      await api.updateProfile(token, { name });
      onUpdate({ name });
      showToast({ type: 'success', msg: 'Profile updated.' });
    } catch (err: any) {
      showToast({ type: 'error', msg: err.message ?? 'Update failed' });
    }
    setSaving(false);
  }

  function showToast(t: Toast) {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
      <form onSubmit={save} className="space-y-4">
        <FieldInput label="Full name" value={name} onChange={setName} />
        <FieldInput label="Email address" value={me?.user?.email ?? ''} onChange={() => {}} disabled placeholder="" />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {toast && (
            <span className={`text-xs flex items-center gap-1.5 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {toast.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              {toast.msg}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function PasswordSection({ token }: { token: string }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<Toast | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) { setToast({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (form.next.length < 6)       { setToast({ type: 'error', msg: 'Password must be at least 6 characters.' }); return; }
    setSaving(true); setToast(null);
    try {
      await api.changePassword(token, { currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' });
      showToast({ type: 'success', msg: 'Password changed.' });
    } catch (err: any) {
      showToast({ type: 'error', msg: err.message ?? 'Change failed' });
    }
    setSaving(false);
  }

  function showToast(t: Toast) {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Change Password</h2>
      <form onSubmit={save} className="space-y-4">
        <FieldInput label="Current password" type="password" value={form.current} onChange={v => setForm(f => ({ ...f, current: v }))} />
        <FieldInput label="New password"     type="password" value={form.next}    onChange={v => setForm(f => ({ ...f, next: v }))}    placeholder="Min 6 characters" />
        <FieldInput label="Confirm password" type="password" value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Update password'}
          </button>
          {toast && (
            <span className={`text-xs flex items-center gap-1.5 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {toast.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              {toast.msg}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function PlanSection({ me }: { me: any }) {
  const plan = me?.user?.plan ?? 'free';
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white mb-3">Plan &amp; Limits</h2>
      <div className="space-y-2 text-sm">
        <Row label="Current plan" value={<span className="capitalize text-green-400">{plan}</span>} />
        {me?.plan?.smsLimit > 0 && <Row label="SMS limit" value={`${me.plan.smsLimit.toLocaleString()} / month`} />}
        {me?.plan?.deviceLimit && <Row label="Device limit" value={me.plan.deviceLimit} />}
      </div>
      <a href="/dashboard/billing" className="inline-block mt-4 text-xs text-green-400 hover:text-green-300 transition-colors">
        View plans &amp; upgrade →
      </a>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
