import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Lock, Palette, Save, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import Navbar from './NavBar';
import { useTheme, THEMES } from '../ThemeContext';
import { exportSummaryPDF, exportFinancePDF } from '../utils/exportData';

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const THEME_LIST = [
  { key: 'default', label: 'Cyber Blue',   color: '#22d3ee' },
  { key: 'violet',  label: 'Violet Dream', color: '#a78bfa' },
  { key: 'emerald', label: 'Matrix Green', color: '#4ade80' },
  { key: 'amber',   label: 'Solar Flare',  color: '#f59e0b' },
  { key: 'rose',    label: 'Neon Rose',    color: '#f87171' },
];

export default function SettingsPage() {
  const { theme, changeTheme } = useTheme();
  const [timeout, setTimeout_] = useState(() => parseInt(localStorage.getItem('pin_timeout_minutes') || '15'));
  const [saved, setSaved]      = useState(false);
  const [exporting, setExporting] = useState(null); // 'summary' | 'finance' | null

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'summary') await exportSummaryPDF();
      else await exportFinancePDF();
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  const save = () => {
    localStorage.setItem('pin_timeout_minutes', timeout);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const accentColor = THEMES[theme]?.accent || '#22d3ee';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: accentColor + '15' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[120px]" style={{ background: accentColor + '10' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border" style={{ ...GLASS, borderColor: accentColor + '40', boxShadow: `0 0 24px ${accentColor}25` }}>
            <Settings size={32} style={{ color: accentColor }} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-2">SETTINGS</h1>
          <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: accentColor + '80' }}>Configure · Personalise</p>
        </motion.div>

        <div className="space-y-6">
          {/* Theme */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-3xl p-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Palette size={14} /> Accent Theme
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {THEME_LIST.map(t => (
                <button key={t.key} onClick={() => changeTheme(t.key)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300"
                  style={theme === t.key
                    ? { background: t.color + '20', border: `2px solid ${t.color}`, boxShadow: `0 0 16px ${t.color}40`, transform: 'scale(1.05)' }
                    : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-7 h-7 rounded-full transition-all" style={{ background: t.color, boxShadow: theme === t.key ? `0 0 12px ${t.color}` : 'none' }} />
                  <span className="text-[9px] font-mono text-center leading-tight" style={{ color: theme === t.key ? t.color : '#475569' }}>{t.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 font-mono mt-3">Changes apply instantly across the app.</p>
          </motion.div>

          {/* PIN Lock Timeout */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="rounded-3xl p-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Lock size={14} /> PIN Lock Timeout
            </h2>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={120} value={timeout} onChange={e => setTimeout_(+e.target.value)} className="flex-1" />
              <span className="text-lg font-bold w-20 text-right" style={{ color: accentColor }}>{timeout} min</span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-2">App re-locks after {timeout} minute{timeout !== 1 ? 's' : ''} of inactivity.</p>
          </motion.div>

          {/* Export Reports */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl p-6" style={GLASS}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Download size={14} /> Export Reports
            </h2>

            {/* Summary Report */}
            <div className="mb-3 p-4 rounded-2xl" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-xs font-bold text-violet-300 mb-1">Summary Report</p>
              <p className="text-[11px] text-slate-600 font-mono mb-3">Todos · Habits · Mood · Journal · Skills · Books · Plans · Achievements · Fears · Comfort Zone</p>
              <button onClick={() => handleExport('summary')} disabled={!!exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
                {exporting === 'summary' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {exporting === 'summary' ? 'Generating...' : 'Download Summary PDF'}
              </button>
            </div>

            {/* Finance Report */}
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <p className="text-xs font-bold text-emerald-300 mb-1">Finance Report</p>
              <p className="text-[11px] text-slate-600 font-mono mb-3">P&L Summary · Month-by-Month · Category Ledger · Full Transaction Ledger · Shopping Plan</p>
              <button onClick={() => handleExport('finance')} disabled={!!exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }}>
                {exporting === 'finance' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                {exporting === 'finance' ? 'Generating...' : 'Download Finance PDF'}
              </button>
            </div>
          </motion.div>

          {/* Save */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
            <button onClick={save}
              className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              style={saved
                ? { background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.5)', color: '#4ade80' }
                : { background: accentColor + '20', border: `1px solid ${accentColor}60`, color: accentColor }}>
              <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
