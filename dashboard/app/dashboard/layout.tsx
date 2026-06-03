'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getToken, clearToken, getUser } from '@/lib/auth';
import {
  LayoutDashboard, Smartphone, Key, MessageSquare,
  CreditCard, LogOut, Menu, ChevronRight, Settings,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',          label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/devices',  label: 'Devices',   icon: Smartphone },
  { href: '/dashboard/keys',     label: 'API Keys',  icon: Key },
  { href: '/dashboard/messages', label: 'Messages',  icon: MessageSquare },
  { href: '/dashboard/billing',  label: 'Billing',   icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]   = useState<any>(null);
  const [open, setOpen]   = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    setUser(getUser());
  }, [router]);

  function logout() { clearToken(); router.push('/login'); }

  const currentNav = NAV.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))) ?? NAV[0];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 flex flex-col
        border-r transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
          <Image src="/logo.png" alt="SMSGate" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-semibold tracking-tight text-white">SMSGate</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} className={active ? 'text-green-400' : 'text-gray-600'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-green-400">{user.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 hover:text-red-400 hover:bg-white/[0.03] transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 h-14 border-b flex-shrink-0 backdrop-blur-xl" style={{ borderColor: 'var(--border)', background: 'rgba(13,17,23,0.8)' }}>
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="SMSGate" width={20} height={20} className="rounded-md" />
            <span className="text-sm font-semibold">SMSGate</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-600">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-gray-300 font-medium">{currentNav.label}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
