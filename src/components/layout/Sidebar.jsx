import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Settings, ChevronDown } from 'lucide-react';
import { NAV_DIRECT, NAV_GROUPS, SETTINGS_ITEM } from './routeMeta';
import Avatar from '../ui/Avatar';
import { cn } from '../ui/cn';

function matchesQuery(item, query) {
  return item.label.toLowerCase().includes(query);
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(NAV_GROUPS.map((g) => [g.label, true])));

  const q = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => matchesQuery(i, q)) })).filter((g) => g.items.length > 0);
  }, [q]);

  const filteredDirect = useMemo(() => (q ? NAV_DIRECT.filter((i) => matchesQuery(i, q)) : NAV_DIRECT), [q]);

  const toggleGroup = (label) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 group',
      isActive ? 'bg-primary/15 text-primary' : 'text-slate-300 hover:bg-white/10 hover:text-white'
    );

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onCloseMobile} />}

      {/* Mobile-only off-canvas drawer — desktop navigation lives in the Topbar instead */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-[280px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-50 transition-transform duration-300 shrink-0 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 h-16 px-4 shrink-0 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm shrink-0">SK</div>
          <span className="text-white font-semibold text-sm truncate">Self Development</span>
        </div>

        <div className="px-3 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search navigation..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/10 text-white placeholder:text-white/40 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {filteredDirect.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass} onClick={onCloseMobile}>
                <item.icon size={17} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {filteredGroups.map((group) => (
            <div key={group.label}>
              <button onClick={() => toggleGroup(group.label)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">
                <group.icon size={13} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown size={13} className={cn('transition-transform', (openGroups[group.label] || q) && 'rotate-180')} />
              </button>
              {(openGroups[group.label] || q) && (
                <div className="flex flex-col gap-1 mt-1">
                  {group.items.map((item) => (
                    <NavLink key={item.path} to={item.path} className={linkClass} onClick={onCloseMobile}>
                      <item.icon size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 flex flex-col gap-1 shrink-0">
          <NavLink to={SETTINGS_ITEM.path} className={linkClass} onClick={onCloseMobile}>
            <Settings size={17} className="shrink-0" />
            <span className="truncate">{SETTINGS_ITEM.label}</span>
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name="Shahid KM" size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Shahid KM</p>
              <p className="text-xs text-white/40 truncate">Self Development</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
