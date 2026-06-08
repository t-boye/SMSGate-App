'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getToken, clearToken, getUser } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  LayoutDashboard, Smartphone, Key, MessageSquare,
  CreditCard, LogOut, Menu, X, Settings, Send, BookOpen, ChevronRight,
  AlertTriangle, AlertCircle,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    group: null,
    items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    group: 'Messaging',
    items: [
      { href: '/dashboard/send',     label: 'Send SMS',  icon: Send          },
      { href: '/dashboard/messages', label: 'Messages',  icon: MessageSquare },
    ],
  },
  {
    group: 'Management',
    items: [
      { href: '/dashboard/devices',  label: 'Devices',   icon: Smartphone },
      { href: '/dashboard/keys',     label: 'API Keys',  icon: Key        },
    ],
  },
  {
    group: 'Account',
    items: [
      { href: '/dashboard/billing',  label: 'Billing',   icon: CreditCard },
      { href: '/dashboard/docs',     label: 'API Docs',  icon: BookOpen   },
      { href: '/dashboard/settings', label: 'Settings',  icon: Settings   },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<any>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    setUser(getUser());
    api.me(token)
      .then(m => setPlanInfo(m.plan))
      .catch(() => {});
  }, [router]);

  function logout() { clearToken(); router.push('/login'); }

  const currentNav = ALL_NAV.find(n =>
    pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
  ) ?? ALL_NAV[0];

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#080c14' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{
        width: 224,
        minWidth: 224,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d1117',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        zIndex: 50,
        transition: 'transform 0.25s ease',
        flexShrink: 0,
      }}
        className={`lg-sidebar ${open ? 'sidebar-open' : 'mobile-hidden'}`}
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', height: 60,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo.png" alt="SMSGate" width={16} height={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', letterSpacing: '-0.02em' }}>SMSGate</span>
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 4 }}
            className="lg-hidden"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {NAV_SECTIONS.map(({ group, items }, si) => (
            <div key={si} style={{ marginTop: si > 0 ? 20 : 0 }}>
              {group && (
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                  color: '#374151', textTransform: 'uppercase',
                  padding: '0 10px', marginBottom: 4,
                }}>
                  {group}
                </p>
              )}
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? '#4ade80' : '#6b7280',
                    background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
                    textDecoration: 'none', marginBottom: 1,
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={15} color={active ? '#4ade80' : '#4b5563'} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '8px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 10px', borderRadius: 10, marginBottom: 4,
              background: 'rgba(255,255,255,0.025)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#4ade80',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: 10, color: '#4b5563', margin: 0, textTransform: 'capitalize' }}>{user.plan ?? 'free'} plan</p>
              </div>
            </div>
          )}
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', width: '100%', borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#4b5563',
          }}>
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header className="dash-header" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 24px', height: 60, flexShrink: 0,
          background: 'rgba(8,12,20,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Mobile menu */}
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}
            className="lg-hidden"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, minWidth: 0 }}>
            <span style={{ color: '#374151', whiteSpace: 'nowrap' }} className="lg-breadcrumb-prefix">Dashboard</span>
            <ChevronRight size={12} color="#1f2937" className="lg-breadcrumb-prefix" />
            <span style={{ color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentNav.label}</span>
          </div>

          {/* Avatar */}
          <div style={{ marginLeft: 'auto' }}>
            {user && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#4ade80',
              }}>
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Plan expiry banner */}
        {planInfo && (planInfo.expired || (planInfo.expiresAt && Math.ceil((new Date(planInfo.expiresAt).getTime() - Date.now()) / 86_400_000) <= 7)) && (
          <Link href="/dashboard/billing" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 24px', flexShrink: 0, cursor: 'pointer',
              background: planInfo.expired ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.08)',
              borderBottom: planInfo.expired ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(234,179,8,0.2)',
            }}>
              {planInfo.expired
                ? <AlertCircle size={13} color="#ef4444" />
                : <AlertTriangle size={13} color="#ca8a04" />
              }
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: planInfo.expired ? '#ef4444' : '#ca8a04',
              }}>
                {planInfo.expired
                  ? `Your ${planInfo.billedPlan} plan has expired — you're on Free. Renew to restore your limits.`
                  : (() => {
                      const days = Math.ceil((new Date(planInfo.expiresAt).getTime() - Date.now()) / 86_400_000);
                      return `Your ${planInfo.billedPlan} plan expires in ${days} day${days !== 1 ? 's' : ''}. Renew to avoid interruption.`;
                    })()
                }
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: planInfo.expired ? 'rgba(239,68,68,0.7)' : 'rgba(202,138,4,0.7)' }}>
                Renew →
              </span>
            </div>
          </Link>
        )}

        {/* Page */}
        <main className="dash-main" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .lg-sidebar { position: fixed !important; top: 0; left: 0; }
          .mobile-hidden { transform: translateX(-100%) !important; }
          .sidebar-open  { transform: translateX(0)    !important; }
          .lg-hidden { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .lg-sidebar  { position: relative !important; transform: none !important; }
          .lg-hidden   { display: none !important; }
        }
        @media (max-width: 767px) {
          .dash-header { padding: 0 16px !important; }
          .dash-main   { padding: 16px !important; }
          .lg-breadcrumb-prefix { display: none !important; }
        }
      `}</style>
    </div>
  );
}
