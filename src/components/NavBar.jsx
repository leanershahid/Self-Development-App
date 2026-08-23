import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationSetup from "./NotificationSetup";
import { supabase } from "../supabase";
import { useTheme, THEMES } from "../ThemeContext";
import {
  Home, BarChart2, Gift, Smile, Flame, BookOpen, Timer,
  Map, Sparkles, TrendingUp, ClipboardList, FolderOpen,
  Medal, Zap, Swords, Users, Wallet, Star, ScrollText,
  Brain, Activity, Trophy, ChevronDown, Menu, X,
  GraduationCap, Gem, Clock, Heart, Images, Mic2, Shield, Bot, FileText, Briefcase,
  Search, Settings, Utensils, Dumbbell
} from "lucide-react";

// ─── All nav groups with every route ──────────────────────────────────────
const NAV_DIRECT = [
  { label: "Home",        path: "/",                      Icon: Home },
  { label: "Performance", path: "/performance-dashboard", Icon: Activity },
  { label: "Rewards",     path: "/reward-dashboard",      Icon: Gift },
  { label: "AI Coach",    path: "/ai-coach",              Icon: Bot },
  { label: "Settings",    path: "/settings",              Icon: Settings },
];

const NAV_GROUPS = [
  {
    label: "Lifestyle",
    color: "#3D52A0",
    Icon: Smile,
    items: [
      { label: "Mood Tracker",  path: "/mood",      Icon: Smile },
      { label: "Habit Streaks", path: "/habits",    Icon: Flame },
      { label: "Daily Journal", path: "/journal",   Icon: ScrollText },
      { label: "Pomodoro",      path: "/pomodoro",  Icon: Timer },
      { label: "Manners",       path: "/manners",   Icon: Heart },
      { label: "Gallery",       path: "/gallery",   Icon: Images },
      { label: "Workout Diet",  path: "/workout-diet", Icon: Utensils },
      { label: "Gym Tracker",    path: "/gym",          Icon: Dumbbell },
    ],
  },
  {
    label: "Growth",
    color: "#7091E6",
    Icon: Brain,
    items: [
      { label: "Skills Tracker",  path: "/skills",        Icon: Brain },
      { label: "Books & Courses", path: "/books",         Icon: BookOpen },
      { label: "Plans",           path: "/plans",         Icon: Map },
      { label: "Inspirations",    path: "/inspirations",  Icon: Sparkles },
      { label: "Script Writer",   path: "/script-writer", Icon: FileText },
      { label: "Job Finder",      path: "/job-finder",    Icon: Briefcase },
    ],
  },
  {
    label: "Analytics",
    color: "#8697C4",
    Icon: TrendingUp,
    items: [
      { label: "Life Success",   path: "/life-success",   Icon: TrendingUp },
      { label: "Report Card",    path: "/report-card",    Icon: ClipboardList },
      { label: "Previous Todos", path: "/previous-todos", Icon: FolderOpen },
      { label: "Achievements",   path: "/achievements",   Icon: Medal },
    ],
  },
  {
    label: "Mindset",
    color: "#5C6BB0",
    Icon: Mic2,
    items: [
      { label: "Mirror Talk",   path: "/mirror-talk",   Icon: Mic2 },
      { label: "Fear Crusher",  path: "/fear-crusher",  Icon: Swords },
      { label: "Comfort Zone",  path: "/comfort-zone",  Icon: Shield },
    ],
  },
  {
    label: "Social & Fun",
    color: "#93A6D6",
    Icon: Trophy,
    items: [
      { label: "Level System", path: "/level",   Icon: Zap },
      { label: "Boss Fight",   path: "/boss",    Icon: Swords },
      { label: "Friends",      path: "/freinds", Icon: Users },
      { label: "Money Vault",  path: "/money",   Icon: Wallet },
    ],
  },
];

// ─── Dropdown ──────────────────────────────────────────────────────────────
function Dropdown({ group, isActive, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const groupActive = group.items.some(i => isActive(i.path));
  const { Icon: GroupIcon, color } = group;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
          color: open || groupActive ? color : "rgba(148,163,184,0.9)",
          background: open || groupActive ? color + "12" : "transparent",
          border: `1px solid ${open || groupActive ? color + "30" : "transparent"}`,
          borderRadius: 10, padding: "6px 12px", cursor: "pointer",
          transition: "all 0.2s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (!open && !groupActive) { e.currentTarget.style.background = "rgba(112,145,230,0.12)"; e.currentTarget.style.color = "#1e293b"; }}}
        onMouseLeave={e => { if (!open && !groupActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.9)"; }}}
      >
        <GroupIcon size={14} />
        {group.label}
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }} />
      </button>

      {/* Panel — rendered in place, no portal needed */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          minWidth: 220, zIndex: 9999,
          background: "rgba(255,255,255,0.75)", border: "1px solid rgba(112,145,230,0.35)",
          borderRadius: 16, padding: 6,
          boxShadow: `0 24px 60px rgba(61,82,160,0.18), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px ${color}15`,
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          animation: "ddFadeIn 0.18s cubic-bezier(.22,1,.36,1) both",
        }}>
          {/* top accent */}
          <div style={{ position: "absolute", top: 0, left: 18, right: 18, height: 1, background: `linear-gradient(90deg,transparent,${color}80,transparent)`, borderRadius: 1 }} />

          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px 6px" }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: color + "20", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GroupIcon size={13} style={{ color }} />
            </div>
            <span style={{ fontFamily: "Orbitron,monospace", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color, opacity: 0.85 }}>{group.label}</span>
          </div>

          {/* items */}
          {group.items.map(({ label, path, Icon: ItemIcon }) => {
            const active = isActive(path);
            return (
              <button key={path}
                onClick={() => { onNavigate(path); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "8px 10px", borderRadius: 10,
                  border: `1px solid ${active ? color + "25" : "transparent"}`,
                  background: active ? color + "12" : "transparent",
                  cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                  color: active ? "#1e293b" : "rgba(148,163,184,0.8)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(112,145,230,0.12)"; e.currentTarget.style.color = "#1e293b"; e.currentTarget.style.transform = "translateX(2px)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.8)"; e.currentTarget.style.transform = "translateX(0)"; }}}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? color + "20" : "rgba(255,255,255,0.05)", border: `1px solid ${active ? color + "30" : "rgba(112,145,230,0.12)"}` }}>
                  <ItemIcon size={13} style={{ color: active ? color : "#64748b" }} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Global Search ────────────────────────────────────────────────────────
function GlobalSearch({ onNavigate }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    (async () => {
      const [{ data: todos }, { data: plans }, { data: journal }, { data: books }] = await Promise.all([
        supabase.from('ToDo').select('id,title').eq('active', true).ilike('title', `%${q}%`).limit(4),
        supabase.from('plans').select('id,title').ilike('title', `%${q}%`).limit(4),
        supabase.from('journal_entries').select('id,title,date').ilike('title', `%${q}%`).limit(4),
        supabase.from('books_tracker').select('id,title').ilike('title', `%${q}%`).limit(4),
      ]);
      const r = [
        ...(todos||[]).map(x => ({ label: x.title, path: '/',         type: 'Todo' })),
        ...(plans||[]).map(x => ({ label: x.title, path: '/plans',    type: 'Plan' })),
        ...(journal||[]).map(x => ({ label: x.title||x.date, path: '/journal', type: 'Journal' })),
        ...(books||[]).map(x => ({ label: x.title, path: '/books',    type: 'Book' })),
      ];
      setResults(r);
    })();
  }, [query]);

  const typeColor = { Todo: '#3D52A0', Plan: '#7091E6', Journal: '#8697C4', Book: '#5C6BB0' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10,
          background: open ? 'rgba(112,145,230,0.18)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(112,145,230,0.35)', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s' }}>
        <Search size={14} />
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>Search</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, zIndex: 9999,
          background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(112,145,230,0.35)', borderRadius: 16, padding: 8,
          boxShadow: '0 24px 60px rgba(61,82,160,0.18)', backdropFilter: 'blur(32px)' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search todos, plans, journal, books..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(112,145,230,0.12)',
              border: '1px solid rgba(112,145,230,0.35)', color: '#1e293b', fontSize: 13, outline: 'none',
              fontFamily: "'Rajdhani',sans-serif", boxSizing: 'border-box' }} />
          {results.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => { onNavigate(r.path); setOpen(false); setQuery(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                    borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#334155', fontFamily: "'Rajdhani',sans-serif", fontSize: 13, textAlign: 'left',
                    transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(112,145,230,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 6,
                    background: typeColor[r.type] + '20', color: typeColor[r.type], border: `1px solid ${typeColor[r.type]}40` }}>
                    {r.type}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                </button>
              ))}
            </div>
          )}
          {query && results.length === 0 && (
            <p style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px' }}>No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme } = useTheme();
  const accent = THEMES[theme]?.accent || '#3D52A0';

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const go = (path) => { navigate(path); setMobileOpen(false); };

  return (
    <>
      <div style={{ height: 62 }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes ddFadeIn {
          from { opacity:0; transform:translateX(-50%) translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes logoShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes scanLine { to { left: 110%; } }
        .nb-logo {
          font-family: 'Orbitron', monospace; font-weight: 900; font-size: 16px;
          letter-spacing: 0.14em;
          background: linear-gradient(90deg, #3D52A0, #7091E6 40%, #ADBBDA);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: logoShimmer 4s linear infinite;
          cursor: pointer; transition: transform 0.2s; white-space: nowrap; flex-shrink: 0;
        }
        .nb-logo:hover { transform: scale(1.05); }
        .nb-scan::after {
          content:''; position:absolute; top:0; bottom:0; left:-20%; width:14%;
          background: linear-gradient(90deg,transparent,rgba(0,229,255,0.04),transparent);
          animation: scanLine 7s linear infinite; pointer-events:none;
        }
        .nb-mob-panel {
          background: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(112,145,230,0.35);
          backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
          max-height: 88vh; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #1e293b transparent;
          animation: mobSlide 0.25s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes mobSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 1024px) { .nb-desktop{display:none!important} .nb-mob-btn{display:flex!important} }
        @media (min-width: 1025px) { .nb-mob-btn{display:none!important} }
      `}</style>

      <div style={{ fontFamily: "'Rajdhani',sans-serif", position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        {/* Bar */}
        <div className="nb-scan" style={{
          background: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(112,145,230,0.35)",
          backdropFilter: "blur(28px) saturate(1.8)", WebkitBackdropFilter: "blur(28px) saturate(1.8)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(112,145,230,0.18)",
          position: "relative", overflow: "visible",
        }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, gap: 12 }}>

            {/* Logo */}
            <span className="nb-logo" onClick={() => go("/")}>◈ SHAHID KM</span>

            {/* Desktop nav */}
            <div className="nb-desktop" style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Direct links */}
              {NAV_DIRECT.map(({ label, path, Icon }) => {
                const active = isActive(path);
                return (
                  <button key={path} onClick={() => go(path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
                      color: active ? accent : "rgba(148,163,184,0.9)",
                      background: active ? accent + "1a" : "transparent",
                      border: `1px solid ${active ? accent + "40" : "transparent"}`,
                      borderRadius: 10, padding: "6px 12px", cursor: "pointer",
                      transition: "all 0.2s", whiteSpace: "nowrap",
                      boxShadow: active ? `0 0 14px ${accent}20` : "none",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(112,145,230,0.12)"; e.currentTarget.style.color = "#1e293b"; e.currentTarget.style.borderColor = "rgba(112,145,230,0.18)"; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.9)"; e.currentTarget.style.borderColor = "transparent"; }}}
                  >
                    <Icon size={14} style={{ opacity: 0.85 }} />
                    {label}
                  </button>
                );
              })}

              {/* Divider */}
              <div style={{ width: 1, height: 18, background: "rgba(112,145,230,0.18)", margin: "0 6px" }} />

              {/* Dropdown groups */}
              {NAV_GROUPS.map(group => (
                <Dropdown key={group.label} group={group} isActive={isActive} onNavigate={go} />
              ))}
            </div>

            {/* Notification Bell */}
            {/* <GlobalSearch onNavigate={go} /> */}
            <NotificationSetup />

            {/* Hamburger */}
            <button className="nb-mob-btn"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                background: mobileOpen ? accent + "1a" : "rgba(255,255,255,0.05)",
                border: `1px solid ${mobileOpen ? accent + "50" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, padding: 8, cursor: "pointer",
                color: mobileOpen ? accent : "#94a3b8",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0,
              }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="nb-mob-panel">
            <div style={{ padding: "10px 0 16px" }}>

              {/* Direct links row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "4px 12px 8px" }}>
                {NAV_DIRECT.map(({ label, path, Icon }) => {
                  const active = isActive(path);
                  return (
                    <button key={path} onClick={() => go(path)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                        borderRadius: 12, border: `1px solid ${active ? accent + "40" : "rgba(112,145,230,0.12)"}`,
                        background: active ? accent + "1a" : "rgba(255,255,255,0.03)",
                        cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600,
                        color: active ? accent : "rgba(148,163,184,0.8)", transition: "all 0.18s",
                      }}>
                      <Icon size={15} style={{ color: active ? accent : "#475569", flexShrink: 0 }} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Groups */}
              {NAV_GROUPS.map((group) => {
                const { Icon: GroupIcon, color } = group;
                return (
                  <div key={group.label}>
                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 16px" }} />

                    {/* Section label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px 6px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: color + "20", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <GroupIcon size={12} style={{ color }} />
                      </div>
                      <span style={{ fontFamily: "Orbitron,monospace", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color, opacity: 0.85, fontWeight: 700 }}>{group.label}</span>
                    </div>

                    {/* 2-col grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 12px" }}>
                      {group.items.map(({ label, path, Icon: ItemIcon }) => {
                        const active = isActive(path);
                        return (
                          <button key={path} onClick={() => go(path)}
                            style={{
                              display: "flex", alignItems: "center", gap: 9, padding: "10px 12px",
                              borderRadius: 12, border: `1px solid ${active ? color + "30" : "rgba(255,255,255,0.05)"}`,
                              background: active ? color + "10" : "rgba(255,255,255,0.02)",
                              cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12.5, fontWeight: 600,
                              color: active ? "#1e293b" : "rgba(148,163,184,0.75)", transition: "all 0.18s",
                            }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? color + "20" : "rgba(255,255,255,0.05)", border: `1px solid ${active ? color + "30" : "rgba(112,145,230,0.12)"}` }}>
                              <ItemIcon size={13} style={{ color: active ? color : "#475569" }} />
                            </div>
                            <span style={{ flex: 1, lineHeight: 1.2 }}>{label}</span>
                            {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
