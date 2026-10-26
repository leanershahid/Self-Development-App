import React from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Menu, LogOut, Settings, ChevronDown, Sun, Moon, Search } from 'lucide-react';
import { getPageTitle } from './routeMeta';
import DesktopNav from './DesktopNav';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';
import NotificationSetup from '../NotificationSetup';
import { useTheme } from '../../ThemeStore';

export default function Topbar({ onOpenMobileSidebar, onOpenSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)]">
      <button onClick={onOpenMobileSidebar} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] shrink-0" aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <NavLink to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">SK</div>
        <span className="hidden sm:block text-sm font-semibold text-[var(--text)] whitespace-nowrap">Self Development</span>
      </NavLink>

      <h1 className="lg:hidden flex-1 min-w-0 text-sm font-semibold text-[var(--text)] truncate">{pageTitle}</h1>

      <DesktopNav />

      <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors text-sm"
        >
          <Search size={15} />
          <span>Search</span>
          <kbd className="text-[10px] border border-[var(--border)] rounded px-1 py-0.5 ml-1">Ctrl K</kbd>
        </button>
        <IconButton label="Search" className="sm:hidden" onClick={onOpenSearch}>
          <Search size={17} />
        </IconButton>
        <div className="hidden sm:flex items-center gap-2">
          <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </IconButton>
          <NotificationSetup />
        </div>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
              <Avatar name="Shahid KM" size="sm" />
              <ChevronDown size={14} className="text-[var(--text-muted)] hidden sm:block" />
            </button>
          }
        >
          <DropdownItem icon={<Settings size={15} />} onClick={() => navigate('/settings')}>Settings</DropdownItem>
          <DropdownItem
            icon={<LogOut size={15} />}
            onClick={() => {
              localStorage.removeItem('pin_unlocked_at');
              window.location.reload();
            }}
          >
            Lock App
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
