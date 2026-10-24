import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from '../ui/toast-context';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
