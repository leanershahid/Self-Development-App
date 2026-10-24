import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { NAV_DIRECT, NAV_GROUPS } from './routeMeta';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { cn } from '../ui/cn';

export default function DesktopNav() {
  const location = useLocation();
  const isGroupActive = (group) => group.items.some((i) => location.pathname === i.path);

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap',
      isActive ? 'bg-primary/10 text-primary' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
    );

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {NAV_DIRECT.map((item) => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass}>
          <item.icon size={15} />
          {item.label}
        </NavLink>
      ))}

      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {NAV_GROUPS.map((group) => {
        const active = isGroupActive(group);
        return (
          <Dropdown
            key={group.label}
            align="start"
            trigger={
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap',
                  active ? 'bg-primary/10 text-primary' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                )}
              >
                <group.icon size={15} />
                {group.label}
                <ChevronDown size={13} className="opacity-60" />
              </button>
            }
          >
            {group.items.map((item) => (
              <DropdownItem key={item.path} as={NavLink} to={item.path} icon={<item.icon size={15} />}>
                {item.label}
              </DropdownItem>
            ))}
          </Dropdown>
        );
      })}
    </nav>
  );
}
