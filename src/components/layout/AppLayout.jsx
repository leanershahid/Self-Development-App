import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from '../ui/toast-context';
import UniversalSearch from '../UniversalSearch';
import QuickCapture from '../QuickCapture';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 min-w-0">{children}</main>
        <UniversalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        <QuickCapture />
      </div>
    </ToastProvider>
  );
}
