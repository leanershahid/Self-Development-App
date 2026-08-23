import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell, RadialBarChart, RadialBar,
    Legend, PolarAngleAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Flame, Target, Zap, Award, BarChart3, Activity, Grid3x3 } from 'lucide-react';
import Navbar from './NavBar';

const supabase = createClient(
    'https://quufeiwzsgiuwkeyjjns.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg'
);

const GLASS = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

function getRating(rate) {
    if (rate >= 90) return { label: 'LEGENDARY', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' };
    if (rate >= 75) return { label: 'ELITE', color: '#22d3ee', glow: 'rgba(34,211,238,0.4)' };
    if (rate >= 60) return { label: 'SOLID', color: '#818cf8', glow: 'rgba(129,140,248,0.4)' };
    if (rate >= 45) return { label: 'AVERAGE', color: '#fb923c', glow: 'rgba(251,146,60,0.4)' };
    return { label: 'STRUGGLING', color: '#f87171', glow: 'rgba(248,113,113,0.4)' };
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 0 20px rgba(34,211,238,0.15)' }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>{label}</p>
            <p style={{ color: '#22d3ee', fontWeight: 700, fontSize: 16 }}>{d?.rate?.toFixed(1)}% Success</p>
            <p style={{ color: '#4ade80', fontSize: 11, marginTop: 4 }}>✓ {d?.completed} done</p>
            <p style={{ color: '#f87171', fontSize: 11 }}>✗ {d?.failed} failed</p>
        </div>
    );
};

export default function LifeSuccessRate() {
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('composed'); // 'composed' | 'radial' | 'heatmap'

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ToDo')
                .select('created_at, completed, active')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by date
            const dayMap = new Map();
            (data || []).forEach(todo => {
                const day = todo.created_at.split('T')[0];
                if (!dayMap.has(day)) dayMap.set(day, { total: 0, completed: 0, failed: 0 });
                const d = dayMap.get(day);
                d.total++;
                if (todo.completed && todo.active) d.completed++;
                else if (todo.active) d.failed++;
            });

            const chartData = Array.from(dayMap.entries()).map(([day, d]) => ({
                date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: day,
                rate: d.total > 0 ? parseFloat(((d.completed / d.total) * 100).toFixed(1)) : 0,
                completed: d.completed,
                failed: d.failed,
                total: d.total,
            }));

            setAllData(chartData);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const overallRate = allData.length
        ? allData.reduce((s, d) => s + d.rate, 0) / allData.length
        : 0;

    const totalCompleted = allData.reduce((s, d) => s + d.completed, 0);
    const totalFailed = allData.reduce((s, d) => s + d.failed, 0);
    const bestDay = allData.reduce((best, d) => d.rate > (best?.rate ?? -1) ? d : best, null);
    const worstDay = allData.reduce((worst, d) => d.rate < (worst?.rate ?? 101) ? d : worst, null);
    const streak = (() => {
        let s = 0;
        for (let i = allData.length - 1; i >= 0; i--) {
            if (allData[i].rate >= 50) s++; else break;
        }
        return s;
    })();

    const rating = getRating(overallRate);

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <Navbar />
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-900 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase animate-pulse">Loading Life Data...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />

            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-900/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-fuchsia-900/20 blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] w-[20%] h-[20%] rounded-full bg-indigo-900/20 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_10%,transparent_100%)]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">

                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-5 border border-cyan-500/30"
                        style={{ ...GLASS, boxShadow: `0 0 24px ${rating.glow}` }}>
                        <Activity size={32} style={{ color: rating.color }} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-2">
                        LIFE SUCCESS RATE
                    </h1>
                    <p className="text-cyan-400/50 font-mono text-xs tracking-[0.3em] uppercase">
                        Full Journey · Achievement Graph · All-Time Stats
                    </p>
                </motion.div>

                {/* Big Rate Card */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="rounded-3xl p-8 mb-8 text-center relative overflow-hidden"
                    style={{ ...GLASS, boxShadow: `0 0 60px ${rating.glow}, 0 8px 32px rgba(0,0,0,0.4)` }}>
                    <div className="absolute inset-0 opacity-5"
                        style={{ background: `radial-gradient(circle at 50% 50%, ${rating.color}, transparent 70%)` }} />

                    <p className="text-xs font-mono tracking-[0.4em] uppercase mb-3" style={{ color: rating.color }}>
                        Overall Life Rating
                    </p>
                    <div className="text-8xl md:text-9xl font-black mb-2 tabular-nums"
                        style={{ color: rating.color, textShadow: `0 0 40px ${rating.glow}` }}>
                        {overallRate.toFixed(1)}<span className="text-4xl md:text-5xl">%</span>
                    </div>
                    <div className="inline-block px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase border"
                        style={{ color: rating.color, borderColor: rating.color + '50', background: rating.color + '15' }}>
                        {rating.label}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6 w-full max-w-lg mx-auto h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${overallRate}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${rating.color}80, ${rating.color})` }} />
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <Target size={20} className="text-cyan-400" />, label: 'Total Tasks', value: totalCompleted + totalFailed, color: 'text-cyan-400' },
                        { icon: <Zap size={20} className="text-emerald-400" />, label: 'Achieved', value: totalCompleted, color: 'text-emerald-400' },
                        { icon: <TrendingDown size={20} className="text-rose-400" />, label: 'Failed', value: totalFailed, color: 'text-rose-400' },
                        { icon: <Flame size={20} className="text-amber-400" />, label: 'Win Streak', value: `${streak}d`, color: 'text-amber-400' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className="rounded-2xl p-5 text-center" style={GLASS}>
                            <div className="flex justify-center mb-2">{s.icon}</div>
                            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Best / Worst */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {[
                        { label: 'Best Day', day: bestDay, icon: <Award size={18} className="text-amber-400" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                        { label: 'Worst Day', day: worstDay, icon: <TrendingDown size={18} className="text-rose-400" />, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                    ].map((item, i) => (
                        <motion.div key={i} initial={{ x: i === 0 ? -20 : 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl p-5 flex items-center gap-4"
                            style={{ ...GLASS, background: item.bg, borderColor: item.border }}>
                            <div className="p-2.5 rounded-xl" style={{ background: item.color + '20', border: `1px solid ${item.border}` }}>
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="font-bold text-slate-200">{item.day?.date ?? '—'}</p>
                                <p className="text-sm font-mono" style={{ color: item.color }}>{item.day?.rate?.toFixed(1) ?? 0}% · {item.day?.completed ?? 0} done / {item.day?.failed ?? 0} failed</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Full Life Graph */}
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                    className="rounded-3xl p-6 md:p-8" style={GLASS}>

                    {/* Tab switcher */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-200 mb-1">Full Life Graph</h2>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                {allData.length} days tracked · Every achievement & fail
                            </p>
                        </div>
                        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {[
                                { v: 'composed', icon: <BarChart3 size={14} />, label: 'Pulse' },
                                { v: 'radial',   icon: <Activity size={14} />,  label: 'Radial' },
                                { v: 'heatmap',  icon: <Grid3x3 size={14} />,   label: 'Heatmap' },
                            ].map(({ v, icon, label }) => (
                                <button key={v} onClick={() => setView(v)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-300"
                                    style={view === v
                                        ? { background: 'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(129,140,248,0.2))', border: '1px solid rgba(34,211,238,0.4)', color: '#22d3ee', boxShadow: '0 0 12px rgba(34,211,238,0.2)' }
                                        : { background: 'transparent', border: '1px solid transparent', color: '#475569' }}>
                                    {icon} {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {allData.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <BarChart3 className="text-slate-700 mx-auto mb-4" size={40} />
                            <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">No data yet</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {view === 'composed' && (
                                <motion.div key="composed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    {/* Composed: stacked bars (done/failed) + success rate line */}
                                    <div className="h-80 w-full rounded-2xl p-4" style={{ background: 'rgba(8,14,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={allData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={0}>
                                                <defs>
                                                    <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                                                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6} />
                                                    </linearGradient>
                                                    <linearGradient id="failGrad2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f87171" stopOpacity={0.8} />
                                                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.4} />
                                                    </linearGradient>
                                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#f59e0b" />
                                                        <stop offset="50%" stopColor="#818cf8" />
                                                        <stop offset="100%" stopColor="#22d3ee" />
                                                    </linearGradient>
                                                    <filter id="glow">
                                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                    </filter>
                                                </defs>
                                                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis dataKey="date" stroke="#1e293b" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                                <YAxis yAxisId="tasks" stroke="#1e293b" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="rate" orientation="right" stroke="#1e293b" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} unit="%" />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                                <ReferenceLine yAxisId="rate" y={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                                                <ReferenceLine yAxisId="rate" y={overallRate} stroke={rating.color} strokeDasharray="6 3" strokeOpacity={0.6}
                                                    label={{ value: `${overallRate.toFixed(0)}%`, fill: rating.color, fontSize: 9, fontFamily: 'monospace', position: 'insideTopRight' }} />
                                                <Bar yAxisId="tasks" dataKey="completed" stackId="a" fill="url(#doneGrad)" radius={[0,0,0,0]} maxBarSize={20} />
                                                <Bar yAxisId="tasks" dataKey="failed" stackId="a" fill="url(#failGrad2)" radius={[3,3,0,0]} maxBarSize={20} />
                                                <Line yAxisId="rate" type="monotoneX" dataKey="rate" stroke="url(#lineGrad)" strokeWidth={2.5}
                                                    dot={false} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#EDE8F5', strokeWidth: 2, filter: 'url(#glow)' }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-5 mt-4 justify-center">
                                        {[
                                            { color: '#22d3ee', label: 'Completed tasks' },
                                            { color: '#f87171', label: 'Failed tasks' },
                                            { color: '#f59e0b', label: 'Success rate %' },
                                        ].map((l, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-6 h-1.5 rounded-full" style={{ background: l.color }} />
                                                <span className="text-[10px] text-slate-500 font-mono">{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'radial' && (
                                <motion.div key="radial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                    {/* Radial bar — last 8 days */}
                                    {(() => {
                                        const last8 = [...allData].slice(-8).map(d => ({
                                            ...d,
                                            fill: d.rate >= 75 ? '#22d3ee' : d.rate >= 50 ? '#818cf8' : d.rate >= 25 ? '#fb923c' : '#f87171',
                                        }));
                                        return (
                                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                                <div className="h-80 w-full rounded-2xl p-4 relative" style={{ background: 'rgba(8,14,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="text-center">
                                                            <div className="text-3xl font-black tabular-nums" style={{ color: rating.color, textShadow: `0 0 20px ${rating.glow}` }}>
                                                                {overallRate.toFixed(0)}%
                                                            </div>
                                                            <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-1">avg rate</div>
                                                        </div>
                                                    </div>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
                                                            data={last8} startAngle={180} endAngle={-180}>
                                                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                                            <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="rate" angleAxisId={0} cornerRadius={6}>
                                                                {last8.map((entry, i) => (
                                                                    <Cell key={i} fill={entry.fill} style={{ filter: `drop-shadow(0 0 6px ${entry.fill}60)` }} />
                                                                ))}
                                                            </RadialBar>
                                                            <Tooltip content={<CustomTooltip />} />
                                                        </RadialBarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                {/* Side labels */}
                                                <div className="flex flex-row lg:flex-col gap-2 flex-wrap justify-center lg:justify-start lg:min-w-[140px]">
                                                    {last8.map((d, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${d.fill}30` }}>
                                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill, boxShadow: `0 0 6px ${d.fill}` }} />
                                                            <span className="text-[10px] font-mono text-slate-400">{d.date}</span>
                                                            <span className="text-[10px] font-bold font-mono ml-auto" style={{ color: d.fill }}>{d.rate}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </motion.div>
                            )}

                            {view === 'heatmap' && (
                                <motion.div key="heatmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    {/* GitHub-style heatmap */}
                                    {(() => {
                                        const dataMap = new Map(allData.map(d => [d.fullDate, d]));
                                        const today = new Date();
                                        const weeks = 18;
                                        const days = weeks * 7;
                                        const cells = [];
                                        for (let i = days - 1; i >= 0; i--) {
                                            const d = new Date(today);
                                            d.setDate(today.getDate() - i);
                                            const key = d.toISOString().split('T')[0];
                                            const entry = dataMap.get(key);
                                            cells.push({ key, entry, dow: d.getDay(), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
                                        }
                                        const grid = [];
                                        for (let w = 0; w < weeks; w++) grid.push(cells.slice(w * 7, w * 7 + 7));

                                        const getColor = (entry) => {
                                            if (!entry) return 'rgba(255,255,255,0.04)';
                                            if (entry.rate >= 75) return '#22d3ee';
                                            if (entry.rate >= 50) return '#818cf8';
                                            if (entry.rate >= 25) return '#fb923c';
                                            return '#f87171';
                                        };
                                        const getGlow = (entry) => {
                                            if (!entry) return 'none';
                                            if (entry.rate >= 75) return '0 0 8px rgba(34,211,238,0.6)';
                                            if (entry.rate >= 50) return '0 0 8px rgba(129,140,248,0.6)';
                                            if (entry.rate >= 25) return '0 0 8px rgba(251,146,60,0.6)';
                                            return '0 0 8px rgba(248,113,113,0.6)';
                                        };

                                        return (
                                            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,14,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div className="flex gap-1 overflow-x-auto pb-2">
                                                    {grid.map((week, wi) => (
                                                        <div key={wi} className="flex flex-col gap-1">
                                                            {week.map((cell, di) => (
                                                                <div key={di} title={cell.entry ? `${cell.label}: ${cell.entry.rate}% (✓${cell.entry.completed} ✗${cell.entry.failed})` : cell.label}
                                                                    className="w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125"
                                                                    style={{ background: getColor(cell.entry), boxShadow: cell.entry ? getGlow(cell.entry) : 'none' }} />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[10px] text-slate-600 font-mono">18 weeks ago</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-600 font-mono">Less</span>
                                                        {['rgba(255,255,255,0.04)', '#f87171', '#fb923c', '#818cf8', '#22d3ee'].map((c, i) => (
                                                            <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
                                                        ))}
                                                        <span className="text-[10px] text-slate-600 font-mono">More</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 font-mono">Today</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </motion.div>

                {/* Day-by-day breakdown */}
                {allData.length > 0 && (
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
                        className="rounded-3xl p-6 md:p-8 mt-8" style={GLASS}>
                        <h2 className="text-lg font-bold text-slate-200 mb-1">Day-by-Day Breakdown</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-6">Every single day of your journey</p>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
                            {[...allData].reverse().map((d, i) => {
                                const r = getRating(d.rate);
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
                                        style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div className="w-20 text-[11px] font-mono text-slate-500 flex-shrink-0">{d.date}</div>
                                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${d.rate}%`, background: r.color, boxShadow: `0 0 6px ${r.glow}` }} />
                                        </div>
                                        <div className="w-14 text-right text-xs font-bold font-mono" style={{ color: r.color }}>{d.rate}%</div>
                                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono w-28 flex-shrink-0">
                                            <span className="text-emerald-400">✓{d.completed}</span>
                                            <span className="text-rose-400">✗{d.failed}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
