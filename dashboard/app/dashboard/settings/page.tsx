'use client';
import { useEffect, useState } from 'react';
import { getToken, getUser, setUser as saveUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, AlertCircle, Loader2, User, Lock, CreditCard, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

type Toast = { type: 'success' | 'error'; msg: string };

export default function SettingsPage() {
  const [me, setMe]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken()!;

  useEffect(() => {
    api.me(token).then(setMe).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl space-y-5">
      <Skeleton className="h-6 w-32 mb-1" />
      <Skeleton className="h-4 w-48" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <Skeleton className="h-4 w-28" />
          {[...Array(2)].map((_, j) => <div key={j}><Skeleton className="h-3 w-20 mb-1.5" /><Skeleton className="h-10" /></div>)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <ProfileSection token={token} me={me} onUpdate={(updated: any) => {
        setMe((m: any) => ({ ...m, user: { ...m.user, ...updated } }));
        saveUser({ ...getUser(), ...updated });
      }} />
      <PasswordSection token={token} />
      <PlanSection me={me} />
    </div>
  );
}

function SectionCard({ icon: Icon, color, title, children }: {
  icon: React.ElementType; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
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
      flash({ type: 'success', msg: 'Profile updated.' });
    } catch (err: any) {
      flash({ type: 'error', msg: err.message ?? 'Update failed' });
    }
    setSaving(false);
  }

  function flash(t: Toast) { setToast(t); setTimeout(() => setToast(null), 3000); }

  return (
    <SectionCard icon={User} color="bg-blue-500/10 text-blue-400" title="Profile">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
          <input value={me?.user?.email ?? ''} disabled className="input-field" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2">
            {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Check size={12} /> Save changes</>}
          </button>
          {toast && (
            <span className={`text-xs flex items-center gap-1.5 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {toast.type === 'success' ? <Check size={11} /> : <AlertCircle size={11} />}
              {toast.msg}
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordSection({ token }: { token: string }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<Toast | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) { flash({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (form.next.length < 6)       { flash({ type: 'error', msg: 'Min 6 characters.' }); return; }
    setSaving(true); setToast(null);
    try {
      await api.changePassword(token, { currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' });
      flash({ type: 'success', msg: 'Password changed.' });
    } catch (err: any) {
      flash({ type: 'error', msg: err.message ?? 'Change failed' });
    }
    setSaving(false);
  }

  function flash(t: Toast) { setToast(t); setTimeout(() => setToast(null), 3000); }

  return (
    <SectionCard icon={Lock} color="bg-yellow-500/10 text-yellow-400" title="Change Password">
      <form onSubmit={save} className="space-y-4">
        {[
          { k: 'current', label: 'Current password',  ph: '••••••••' },
          { k: 'next',    label: 'New password',       ph: 'Min 6 characters' },
          { k: 'confirm', label: 'Confirm new password', ph: '••••••••' },
        ].map(({ k, label, ph }) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={(form as any)[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                placeholder={ph}
                className="input-field pr-10"
              />
              {k === 'current' && (
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                  {show ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2">
            {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : 'Update password'}
          </button>
          {toast && (
            <span className={`text-xs flex items-center gap-1.5 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {toast.type === 'success' ? <Check size={11} /> : <AlertCircle size={11} />}
              {toast.msg}
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

function PlanSection({ me }: { me: any }) {
  const plan = me?.user?.plan ?? 'free';
  return (
    <SectionCard icon={CreditCard} color="bg-green-500/10 text-green-400" title="Plan &amp; Limits">
      <div className="space-y-2 mb-4">
        {[
          { label: 'Current plan', value: <span className="capitalize text-green-400 font-semibold">{plan}</span> },
          ...(me?.plan?.smsLimit > 0 ? [{ label: 'SMS limit', value: `${me.plan.smsLimit.toLocaleString()} / month` }] : []),
          ...(me?.plan?.deviceLimit ? [{ label: 'Device limit', value: me.plan.deviceLimit }] : []),
          ...(me?.plan?.keyLimit    ? [{ label: 'Key limit',    value: me.plan.keyLimit }]    : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm" style={{ borderColor: 'var(--border)' }}>
            <span className="text-gray-500">{label}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>
      <Link href="/dashboard/billing" className="text-xs text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1">
        View plans &amp; upgrade →
      </Link>
    </SectionCard>
  );
}
