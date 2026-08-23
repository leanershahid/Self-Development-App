import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, Info, X, TrendingUp, Star, Calendar } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const INSTRUCTIONS = [
    { step: "1", text: "Log anything you did that felt uncomfortable or scary — big or small." },
    { step: "2", text: "Rate the difficulty from 1 (slightly uncomfortable) to 5 (terrifying but did it)." },
    { step: "3", text: "Add a short reflection: what did you learn or feel after doing it?" },
    { step: "4", text: "Review your log regularly — you'll be amazed how much you've grown." },
];

const DIFF_LABELS = ["", "Slightly Uncomfortable", "Challenging", "Hard", "Very Hard", "Terrifying"];
const DIFF_COLORS = ["", "#22d3ee", "#a78bfa", "#f59e0b", "#f97316", "#ef4444"];

export default function ComfortZone() {
    const [entries, setEntries] = useState([]);
    const [action, setAction] = useState("");
    const [difficulty, setDifficulty] = useState(3);
    const [reflection, setReflection] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchEntries(); }, []);

    async function fetchEntries() {
        const { data } = await supabase.from("comfort_zone").select("*").order("created_at", { ascending: false });
        if (data) setEntries(data);
        setLoading(false);
    }

    async function addEntry() {
        if (!action.trim()) return;
        const { data } = await supabase.from("comfort_zone").insert({
            action: action.trim(),
            difficulty,
            reflection: reflection.trim() || null,
            done_at: new Date().toISOString().split("T")[0],
        }).select().single();
        if (data) setEntries(prev => [data, ...prev]);
        setAction(""); setReflection(""); setDifficulty(3);
    }

    async function deleteEntry(id) {
        await supabase.from("comfort_zone").delete().eq("id", id);
        setEntries(prev => prev.filter(e => e.id !== id));
    }

    const totalPoints = entries.reduce((sum, e) => sum + e.difficulty, 0);
    const avgDiff = entries.length ? (totalPoints / entries.length).toFixed(1) : 0;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`.dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }`}</style>

            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <Zap size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-3 tracking-tight">
                        COMFORT ZONE
                    </h1>
                    <p className="text-amber-400/60 font-mono text-sm tracking-[0.3em] uppercase mb-4">
                        Push It • Log It • Grow From It
                    </p>
                    <button onClick={() => setShowInfo(v => !v)}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 font-mono transition-colors border border-white/5 hover:border-amber-500/30 px-3 py-1.5 rounded-lg">
                        <Info size={13} /> How it works
                    </button>
                </motion.div>

                {/* Instructions */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="dash-glass rounded-2xl p-6 mb-8 border border-amber-500/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-widest">How to use Comfort Zone Log</h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-600 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            <div className="space-y-3">
                                {INSTRUCTIONS.map(({ step, text }) => (
                                    <div key={step} className="flex gap-3 items-start">
                                        <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                        <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-xs text-amber-300/60 font-mono italic">💡 Growth happens at the edge of your comfort zone. Every uncomfortable action you take expands who you are.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <TrendingUp size={20} className="text-amber-400" />
                        <p className="text-2xl font-black text-[#3D52A0]">{entries.length}</p>
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider text-center">Total Pushes</p>
                    </div>
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <Star size={20} className="text-amber-400" />
                        <p className="text-2xl font-black text-[#3D52A0]">{totalPoints}</p>
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider text-center">Courage Points</p>
                    </div>
                    <div className="dash-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                        <Zap size={20} className="text-amber-400" />
                        <p className="text-2xl font-black text-[#3D52A0]">{avgDiff}</p>
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider text-center">Avg Difficulty</p>
                    </div>
                </div>

                {/* Add form */}
                <div className="dash-glass rounded-2xl p-6 mb-8 space-y-4">
                    <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-widest">Log a Comfort Zone Push</h3>
                    <input value={action} onChange={e => setAction(e.target.value)}
                        placeholder="What did you do that was outside your comfort zone?"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/40" />

                    {/* Difficulty selector */}
                    <div>
                        <p className="text-xs text-slate-500 font-mono mb-2 uppercase tracking-wider">
                            Difficulty: <span style={{ color: DIFF_COLORS[difficulty] }}>{DIFF_LABELS[difficulty]}</span>
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button key={d} onClick={() => setDifficulty(d)}
                                    className="flex-1 py-2 rounded-xl text-sm font-bold border transition-all"
                                    style={{
                                        background: difficulty >= d ? DIFF_COLORS[d] + "20" : "rgba(255,255,255,0.03)",
                                        borderColor: difficulty >= d ? DIFF_COLORS[d] + "50" : "rgba(255,255,255,0.06)",
                                        color: difficulty >= d ? DIFF_COLORS[d] : "#475569",
                                    }}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea value={reflection} onChange={e => setReflection(e.target.value)}
                        placeholder="Reflection: How did it feel? What did you learn? (optional)"
                        rows={2}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/40 resize-none" />

                    <button onClick={addEntry}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold py-3 rounded-xl transition-all">
                        <Plus size={16} /> Log Push
                    </button>
                </div>

                {/* Entries */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {entries.map((e, i) => (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}
                                className="dash-glass rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg border"
                                        style={{ background: DIFF_COLORS[e.difficulty] + "15", borderColor: DIFF_COLORS[e.difficulty] + "30", color: DIFF_COLORS[e.difficulty] }}>
                                        {e.difficulty}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#3D52A0] mb-1">{e.action}</p>
                                        {e.reflection && <p className="text-xs text-slate-400 leading-relaxed mb-2 italic">"{e.reflection}"</p>}
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded-full border"
                                                style={{ color: DIFF_COLORS[e.difficulty], background: DIFF_COLORS[e.difficulty] + "10", borderColor: DIFF_COLORS[e.difficulty] + "25" }}>
                                                {DIFF_LABELS[e.difficulty]}
                                            </span>
                                            <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                                                <Calendar size={11} /> {e.done_at}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteEntry(e.id)} className="text-slate-700 hover:text-red-400 transition-colors p-1 shrink-0">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!loading && entries.length === 0 && (
                        <div className="text-center text-slate-600 py-16">
                            <Zap size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-mono text-sm">No pushes logged yet. Do something uncomfortable today.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
