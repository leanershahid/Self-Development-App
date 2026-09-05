import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Trash2, Flame, Trophy, TrendingUp, Calendar, X, Info } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const TRIGGERS = ["Traffic", "Work", "Family", "Social", "Waiting", "Other"];
const INTENSITY_LABELS = ["", "Barely a test", "Mildly annoying", "Testing", "Hard", "Extremely hard"];
const INTENSITY_COLORS = ["", "#8697C4", "#7091E6", "#f59e0b", "#f97316", "#ef4444"];

function toDateStr(iso) {
    return new Date(iso).toISOString().split("T")[0];
}

export default function PatienceMarker() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [trigger, setTrigger] = useState("");
    const [intensity, setIntensity] = useState(3);
    const [note, setNote] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [justLogged, setJustLogged] = useState(false);

    useEffect(() => { fetchLogs(); }, []);

    async function fetchLogs() {
        const { data } = await supabase.from("patience_logs").select("*").order("logged_at", { ascending: false });
        if (data) setLogs(data);
        setLoading(false);
    }

    async function quickLog() {
        const { data } = await supabase.from("patience_logs").insert({ logged_at: new Date().toISOString() }).select().single();
        if (data) setLogs(prev => [data, ...prev]);
        flashLogged();
    }

    async function detailedLog() {
        const { data } = await supabase.from("patience_logs").insert({
            logged_at: new Date().toISOString(),
            trigger: trigger || null,
            intensity,
            note: note.trim() || null,
        }).select().single();
        if (data) setLogs(prev => [data, ...prev]);
        setTrigger(""); setIntensity(3); setNote(""); setDetailsOpen(false);
        flashLogged();
    }

    function flashLogged() {
        setJustLogged(true);
        setTimeout(() => setJustLogged(false), 1200);
    }

    async function deleteLog(id) {
        await supabase.from("patience_logs").delete().eq("id", id);
        setLogs(prev => prev.filter(l => l.id !== id));
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const todayCount = logs.filter(l => toDateStr(l.logged_at) === todayStr).length;
    const weekCount = logs.filter(l => toDateStr(l.logged_at) >= weekAgoStr).length;
    const totalCount = logs.length;

    // streaks: consecutive days (including today) with >=1 log
    const loggedDays = new Set(logs.map(l => toDateStr(l.logged_at)));
    let currentStreak = 0;
    {
        let cursor = new Date();
        while (loggedDays.has(cursor.toISOString().split("T")[0])) {
            currentStreak++;
            cursor.setDate(cursor.getDate() - 1);
        }
    }
    let bestStreak = 0;
    {
        const sortedDays = [...loggedDays].sort();
        let run = 0, prev = null;
        for (const d of sortedDays) {
            if (prev) {
                const diff = (new Date(d) - new Date(prev)) / 86400000;
                run = diff === 1 ? run + 1 : 1;
            } else run = 1;
            bestStreak = Math.max(bestStreak, run);
            prev = d;
        }
    }

    // last 14 days trend
    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        const dStr = d.toISOString().split("T")[0];
        return { date: dStr, count: logs.filter(l => toDateStr(l.logged_at) === dStr).length };
    });
    const maxDay = Math.max(1, ...last14.map(d => d.count));

    // trigger breakdown
    const triggerCounts = TRIGGERS.reduce((acc, t) => {
        const c = logs.filter(l => l.trigger === t).length;
        if (c > 0) acc.push({ trigger: t, count: c });
        return acc;
    }, []).sort((a, b) => b.count - a.count);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen text-slate-700">
            <Navbar />
            <style>{`.dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(134,151,196,0.3); box-shadow: 0 8px 32px rgba(61,82,160,0.1); }`}</style>

            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 text-[#7091E6] border border-[#7091E6]/30 shadow-[0_0_20px_rgba(112,145,230,0.2)]">
                        <Heart size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8697C4] mb-3 tracking-tight">
                        PATIENCE MARKER
                    </h1>
                    <p className="text-[#7091E6]/70 font-mono text-sm tracking-[0.3em] uppercase mb-4">
                        Notice It • Mark It • Build It
                    </p>
                    <button onClick={() => setShowInfo(v => !v)}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-[#3D52A0] font-mono transition-colors border border-[#8697C4]/20 hover:border-[#7091E6]/40 px-3 py-1.5 rounded-lg">
                        <Info size={13} /> How it works
                    </button>
                </motion.div>

                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="dash-glass rounded-2xl p-6 mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-[#3D52A0] font-mono uppercase tracking-widest">How to use Patience Marker</h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-500 hover:text-[#3D52A0] transition-colors"><X size={16} /></button>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                The moment you catch yourself staying calm instead of reacting — traffic, an annoying comment, a long wait — tap the button. That's it. Building awareness of when you succeed is what trains the habit. Add details when you want to spot your patterns.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Big tap button */}
                <div className="flex flex-col items-center mb-8">
                    <motion.button
                        onClick={quickLog}
                        whileTap={{ scale: 0.92 }}
                        className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-1 border-4 transition-colors"
                        style={{
                            background: "linear-gradient(135deg, rgba(112,145,230,0.25), rgba(61,82,160,0.15))",
                            borderColor: "rgba(112,145,230,0.5)",
                            boxShadow: "0 0 40px rgba(112,145,230,0.25)",
                        }}
                    >
                        <Heart size={36} className="text-[#3D52A0]" fill={justLogged ? "#3D52A0" : "none"} />
                        <span className="text-sm font-black uppercase tracking-widest text-[#3D52A0]">
                            {justLogged ? "Logged!" : "I Stayed Patient"}
                        </span>
                    </motion.button>
                    <button onClick={() => setDetailsOpen(v => !v)}
                        className="mt-4 text-xs font-mono text-[#7091E6] hover:text-[#3D52A0] transition-colors flex items-center gap-1.5">
                        <Plus size={13} /> {detailsOpen ? "Cancel" : "Log with details instead"}
                    </button>
                </div>

                {/* Details form */}
                <AnimatePresence>
                    {detailsOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="dash-glass rounded-2xl p-6 mb-8 space-y-4 overflow-hidden">
                            <div>
                                <p className="text-xs text-slate-500 font-mono mb-2 uppercase tracking-wider">What triggered it?</p>
                                <div className="flex flex-wrap gap-2">
                                    {TRIGGERS.map(t => (
                                        <button key={t} onClick={() => setTrigger(t === trigger ? "" : t)}
                                            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                                            style={trigger === t
                                                ? { background: "rgba(112,145,230,0.2)", borderColor: "rgba(112,145,230,0.5)", color: "#3D52A0" }
                                                : { background: "rgba(255,255,255,0.4)", borderColor: "rgba(134,151,196,0.3)", color: "#64748b" }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 font-mono mb-2 uppercase tracking-wider">
                                    How hard was it: <span style={{ color: INTENSITY_COLORS[intensity] }}>{INTENSITY_LABELS[intensity]}</span>
                                </p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(d => (
                                        <button key={d} onClick={() => setIntensity(d)}
                                            className="flex-1 py-2 rounded-xl text-sm font-bold border transition-all"
                                            style={{
                                                background: intensity >= d ? INTENSITY_COLORS[d] + "20" : "rgba(255,255,255,0.4)",
                                                borderColor: intensity >= d ? INTENSITY_COLORS[d] + "50" : "rgba(134,151,196,0.3)",
                                                color: intensity >= d ? INTENSITY_COLORS[d] : "#94a3b8",
                                            }}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea value={note} onChange={e => setNote(e.target.value)}
                                placeholder="What happened? (optional)"
                                rows={2}
                                className="w-full bg-white/40 border border-[#8697C4]/30 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-500 outline-none focus:border-[#7091E6]/60 resize-none" />

                            <button onClick={detailedLog}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all"
                                style={{ background: "rgba(112,145,230,0.2)", border: "1px solid rgba(112,145,230,0.5)", color: "#3D52A0" }}>
                                <Plus size={16} /> Log It
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <TrendingUp size={18} className="text-[#7091E6]" />
                        <p className="text-2xl font-black text-[#3D52A0]">{todayCount}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider text-center">Today</p>
                    </div>
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <Calendar size={18} className="text-[#7091E6]" />
                        <p className="text-2xl font-black text-[#3D52A0]">{weekCount}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider text-center">This Week</p>
                    </div>
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <Flame size={18} className="text-orange-500" />
                        <p className="text-2xl font-black text-[#3D52A0]">{currentStreak}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider text-center">Day Streak</p>
                    </div>
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <Trophy size={18} className="text-amber-500" />
                        <p className="text-2xl font-black text-[#3D52A0]">{bestStreak}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider text-center">Best Streak</p>
                    </div>
                </div>

                {/* 14-day trend */}
                <div className="dash-glass rounded-2xl p-6 mb-8">
                    <h3 className="text-xs font-bold text-[#3D52A0] font-mono uppercase tracking-widest mb-4">Last 14 Days</h3>
                    <div className="flex items-end gap-1.5 h-24">
                        {last14.map(d => (
                            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date}: ${d.count}`}>
                                <div className="w-full rounded-t-md transition-all"
                                    style={{
                                        height: `${(d.count / maxDay) * 100}%`,
                                        minHeight: d.count > 0 ? "6px" : "2px",
                                        background: d.date === todayStr
                                            ? "linear-gradient(180deg, #3D52A0, #7091E6)"
                                            : d.count > 0 ? "rgba(112,145,230,0.5)" : "rgba(134,151,196,0.15)",
                                    }} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[9px] text-slate-500 font-mono">{last14[0].date.slice(5)}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Today</span>
                    </div>
                </div>

                {/* Trigger breakdown */}
                {triggerCounts.length > 0 && (
                    <div className="dash-glass rounded-2xl p-6 mb-8">
                        <h3 className="text-xs font-bold text-[#3D52A0] font-mono uppercase tracking-widest mb-4">Where It Happens Most</h3>
                        <div className="space-y-2">
                            {triggerCounts.map(({ trigger: t, count }) => (
                                <div key={t} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-600 font-medium w-16 shrink-0">{t}</span>
                                    <div className="flex-1 h-2 rounded-full bg-[#8697C4]/15 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(count / triggerCounts[0].count) * 100}%`, background: "linear-gradient(90deg, #3D52A0, #7091E6)" }} />
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent entries */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#3D52A0] font-mono uppercase tracking-widest px-1">Recent Log</h3>
                    <AnimatePresence>
                        {logs.slice(0, 25).map((l, i) => (
                            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.02 }}
                                className="dash-glass rounded-xl p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(112,145,230,0.15)", color: "#3D52A0" }}>
                                    <Heart size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-slate-600 font-mono">
                                            {new Date(l.logged_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                        </span>
                                        {l.trigger && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(112,145,230,0.12)", color: "#3D52A0" }}>{l.trigger}</span>
                                        )}
                                        {l.intensity && (
                                            <span className="text-[10px] font-mono" style={{ color: INTENSITY_COLORS[l.intensity] }}>{INTENSITY_LABELS[l.intensity]}</span>
                                        )}
                                    </div>
                                    {l.note && <p className="text-xs text-slate-500 mt-1 italic">"{l.note}"</p>}
                                </div>
                                <button onClick={() => deleteLog(l.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0">
                                    <Trash2 size={13} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!loading && logs.length === 0 && (
                        <div className="text-center text-slate-500 py-16">
                            <Heart size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-mono text-sm">No moments logged yet. Next time you stay calm, mark it.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
