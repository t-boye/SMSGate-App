'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken, getUser } from '@/lib/auth';
import { LayoutDashboard, Smartphone, Key, MessageSquare, CreditCard, LogOut, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/dashboard',         label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/devices', label: 'Devices',    icon: Smartphone },
  { href: '/dashboard/keys',    label: 'API Keys',   icon: Key },
  { href: '/dashboard/messages',label: 'Messages',   icon: MessageSquare },
  { href: '/dashboard/billing', label: 'Billing',    icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    setUser(getUser());
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-green-400">SMSGate</h1>
          {user && <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href} href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-green-500/10 text-green-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-gray-800 bg-gray-900">
          <button onClick={() => setOpen(true)} className="text-gray-400">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-green-400">SMSGate</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
