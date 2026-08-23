import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  default:     { accent: '#3D52A0', dim: 'rgba(61,82,160,0.14)',   border: 'rgba(61,82,160,0.35)',   glow: 'rgba(61,82,160,0.25)'   },
  periwinkle:  { accent: '#7091E6', dim: 'rgba(112,145,230,0.15)', border: 'rgba(112,145,230,0.4)',  glow: 'rgba(112,145,230,0.25)' },
  mutedBlue:   { accent: '#8697C4', dim: 'rgba(134,151,196,0.15)', border: 'rgba(134,151,196,0.4)',  glow: 'rgba(134,151,196,0.25)' },
  violet:  { accent: '#a78bfa', dim: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', glow: 'rgba(167,139,250,0.2)' },
  emerald: { accent: '#4ade80', dim: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.4)',  glow: 'rgba(74,222,128,0.2)'  },
  amber:   { accent: '#f59e0b', dim: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  glow: 'rgba(245,158,11,0.2)'  },
  rose:    { accent: '#f87171', dim: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', glow: 'rgba(248,113,113,0.2)' },
};

function applyTheme(key) {
  const t = THEMES[key] || THEMES.default;
  const root = document.documentElement;
  root.style.setProperty('--accent',        t.accent);
  root.style.setProperty('--accent-dim',    t.dim);
  root.style.setProperty('--accent-border', t.border);
  root.style.setProperty('--accent-glow',   t.glow);
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'default');

  useEffect(() => { applyTheme(theme); }, [theme]);

  const changeTheme = (key) => {
    setTheme(key);
    localStorage.setItem('app_theme', key);
    applyTheme(key);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
