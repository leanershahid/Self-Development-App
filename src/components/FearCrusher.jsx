import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Trash2, ShieldCheck, Shield, Info, X, Trophy } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const INSTRUCTIONS = [
    { step: "1", text: "Write down a fear that is holding you back — be honest with yourself." },
    { step: "2", text: "Set a specific challenge: a small action you can take to face that fear." },
    { step: "3", text: "Go do it. Come back and mark it as Conquered when you've faced it." },
    { step: "4", text: "Every fear you conquer makes the next one easier. Build your courage muscle." },
];

const LEVELS = [
    { min: 0, label: "Beginner", color: "#64748b" },
    { min: 3, label: "Brave", color: "#22d3ee" },
    { min: 7, label: "Warrior", color: "#a78bfa" },
    { min: 15, label: "Fearless", color: "#f59e0b" },
];

export default function FearCrusher() {
    const [fears, setFears] = useState([]);
    const [fear, setFear] = useState("");
    const [challenge, setChallenge] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchFears(); }, []);

    async function fetchFears() {
        const { data } = await supabase.from("fear_crusher").select("*").order("created_at", { ascending: false });
        if (data) setFears(data);
        setLoading(false);
    }

    async function addFear() {
        if (!fear.trim() || !challenge.trim()) return;
        const { data } = await supabase.from("fear_crusher").insert({ fear: fear.trim(), challenge: challenge.trim(), conquered: false }).select().single();
        if (data) setFears(prev => [data, ...prev]);
        setFear(""); setChallenge("");
    }

    async function toggleConquered(id, current) {
        await supabase.from("fear_crusher").update({ conquered: !current }).eq("id", id);
        setFears(prev => prev.map(f => f.id === id ? { ...f, conquered: !current } : f));
    }

    async function deleteFear(id) {
        await supabase.from("fear_crusher").delete().eq("id", id);
        setFears(prev => prev.filter(f => f.id !== id));
    }

    const conquered = fears.filter(f => f.conquered).length;
    const level = [...LEVELS].reverse().find(l => conquered >= l.min) || LEVELS[0];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`.dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }`}</style>

            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 text-red-400 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Swords size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-3 tracking-tight">
                        FEAR CRUSHER
                    </h1>
                    <p className="text-red-400/60 font-mono text-sm tracking-[0.3em] uppercase mb-4">
                        Face It • Fight It • Conquer It
                    </p>
                    <button onClick={() => setShowInfo(v => !v)}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 font-mono transition-colors border border-white/5 hover:border-red-500/30 px-3 py-1.5 rounded-lg">
                        <Info size={13} /> How it works
                    </button>
                </motion.div>

                {/* Instructions */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="dash-glass rounded-2xl p-6 mb-8 border border-red-500/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-red-400 font-mono uppercase tracking-widest">How to use Fear Crusher</h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-600 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            <div className="space-y-3">
                                {INSTRUCTIONS.map(({ step, text }) => (
                                    <div key={step} className="flex gap-3 items-start">
                                        <span className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                        <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                <p className="text-xs text-red-300/60 font-mono italic">💡 Courage is not the absence of fear — it's taking action despite it. Each conquest rewires your brain to be bolder.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="dash-glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <Trophy size={22} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#3D52A0]">{conquered}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Fears Conquered</p>
                        </div>
                    </div>
                    <div className="dash-glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-2 rounded-xl border" style={{ background: level.color + "15", borderColor: level.color + "30" }}>
                            <ShieldCheck size={22} style={{ color: level.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white" style={{ color: level.color }}>{level.label}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Courage Level</p>
                        </div>
                    </div>
                </div>

                {/* Add form */}
                <div className="dash-glass rounded-2xl p-6 mb-8 space-y-3">
                    <h3 className="text-xs font-bold text-red-400 font-mono uppercase tracking-widest mb-4">Add a New Fear</h3>
                    <input value={fear} onChange={e => setFear(e.target.value)}
                        placeholder="My fear is... (e.g. speaking in public)"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/40" />
                    <input value={challenge} onChange={e => setChallenge(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addFear()}
                        placeholder="My challenge to face it... (e.g. speak for 1 min in front of mirror)"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/40" />
                    <button onClick={addFear}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl transition-all">
                        <Plus size={16} /> Add Fear
                    </button>
                </div>

                {/* Fear list */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {fears.map((f, i) => (
                            <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}
                                className={`dash-glass rounded-2xl p-5 transition-all ${f.conquered ? "border-emerald-500/20" : "border-red-500/10"}`}>
                                <div className="flex items-start gap-4">
                                    <button onClick={() => toggleConquered(f.id, f.conquered)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                                        {f.conquered
                                            ? <ShieldCheck size={24} className="text-emerald-400" />
                                            : <Shield size={24} className="text-slate-600" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold mb-1 ${f.conquered ? "line-through text-slate-500" : "text-[#3D52A0]"}`}>{f.fear}</p>
                                        <p className={`text-xs leading-relaxed ${f.conquered ? "text-slate-600" : "text-slate-400"}`}>
                                            <span className="text-red-400/60 font-mono">Challenge: </span>{f.challenge}
                                        </p>
                                        {f.conquered && <span className="inline-block mt-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">✓ CONQUERED</span>}
                                    </div>
                                    <button onClick={() => deleteFear(f.id)} className="text-slate-700 hover:text-red-400 transition-colors p-1 shrink-0">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!loading && fears.length === 0 && (
                        <div className="text-center text-slate-600 py-16">
                            <Swords size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-mono text-sm">No fears logged yet. Be honest — what's holding you back?</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
