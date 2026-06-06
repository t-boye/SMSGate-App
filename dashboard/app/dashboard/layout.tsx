'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getToken, clearToken, getUser } from '@/lib/auth';
import {
  LayoutDashboard, Smartphone, Key, MessageSquare,
  CreditCard, LogOut, Menu, X, Settings,
  Send, BookOpen, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',          label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/send',     label: 'Send SMS',   icon: Send },
  { href: '/dashboard/devices',  label: 'Devices',    icon: Smartphone },
  { href: '/dashboard/keys',     label: 'API Keys',   icon: Key },
  { href: '/dashboard/messages', label: 'Messages',   icon: MessageSquare },
  { href: '/dashboard/billing',  label: 'Billing',    icon: CreditCard },
  { href: '/dashboard/docs',     label: 'API Docs',   icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings',   icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    setUser(getUser());
  }, [router]);

  function logout() { clearToken(); router.push('/login'); }

  const currentNav = NAV.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))) ?? NAV[0];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 flex flex-col
        transition-transform duration-300 ease-in-out border-r
        lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

        {/* Logo row */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Image src="/logo.png" alt="SMSGate" width={26} height={26} className="rounded-lg" />
          <span className="font-bold text-white tracking-tight text-sm">SMSGate</span>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-gray-600 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-green-500/10 text-green-400 font-medium'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={15} className={active ? 'text-green-400' : 'text-gray-600'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ background: 'var(--green-subtle)', color: 'var(--green)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs text-gray-600 hover:text-red-400 hover:bg-white/[0.03] transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Main ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 h-14 border-b shrink-0" style={{
          background: 'rgba(3,5,11,0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}>
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500 hover:text-white transition-colors p-1">
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="hidden sm:inline">Dashboard</span>
            <ChevronRight size={11} className="hidden sm:inline text-gray-700" />
            <span className="text-gray-300 font-medium">{currentNav.label}</span>
          </div>

          {/* Right side — mobile logo */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="SMSGate" width={20} height={20} className="rounded-md" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
