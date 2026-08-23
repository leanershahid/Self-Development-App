import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Plus, Trash2, CheckCircle2, Circle, Flame, Sparkles, Info, X } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const STREAK_KEY = "mirror_talk_streak";
const TODAY = () => new Date().toDateString();

function loadStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { streak: 0, lastDate: null, saidIds: [] }; }
    catch { return { streak: 0, lastDate: null, saidIds: [] }; }
}

const INSTRUCTIONS = [
    { step: "1", text: "Add your personal affirmations — things you want to believe about yourself." },
    { step: "2", text: "Every morning, stand in front of a mirror and say each one out loud with full confidence." },
    { step: "3", text: "Tap each affirmation to mark it as said. Complete all to build your streak." },
    { step: "4", text: "Consistency is key — even 5 minutes daily rewires your mindset over time." },
];

export default function MirrorTalk() {
    const [affirmations, setAffirmations] = useState([]);
    const [input, setInput] = useState("");
    const [streakData, setStreakData] = useState(loadStreak);
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAffirmations(); }, []);
    useEffect(() => { localStorage.setItem(STREAK_KEY, JSON.stringify(streakData)); }, [streakData]);

    async function fetchAffirmations() {
        const { data } = await supabase.from("mirror_talk").select("*").order("created_at", { ascending: true });
        if (data) setAffirmations(data);
        setLoading(false);
    }

    async function addAffirmation() {
        const text = input.trim();
        if (!text) return;
        const { data } = await supabase.from("mirror_talk").insert({ text }).select().single();
        if (data) setAffirmations(prev => [...prev, data]);
        setInput("");
    }

    async function deleteAffirmation(id) {
        await supabase.from("mirror_talk").delete().eq("id", id);
        setAffirmations(prev => prev.filter(a => a.id !== id));
        setStreakData(prev => ({ ...prev, saidIds: prev.saidIds.filter(sid => sid !== id) }));
    }

    function toggleSaid(id) {
        const alreadySaid = streakData.saidIds.includes(id);
        const newSaidIds = alreadySaid
            ? streakData.saidIds.filter(sid => sid !== id)
            : [...streakData.saidIds, id];

        const allSaid = affirmations.length > 0 && affirmations.every(a => newSaidIds.includes(a.id));
        let { streak, lastDate } = streakData;

        if (allSaid && lastDate !== TODAY()) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            streak = lastDate === yesterday.toDateString() ? streak + 1 : 1;
            lastDate = TODAY();
        }

        setStreakData({ streak, lastDate, saidIds: newSaidIds });
    }

    function resetDaily() {
        setStreakData(prev => ({ ...prev, saidIds: [] }));
    }

    const saidCount = affirmations.filter(a => streakData.saidIds.includes(a.id)).length;
    const total = affirmations.length;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`.dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }`}</style>

            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(167,139,250,0.2)]">
                        <Mic2 size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-3 tracking-tight">
                        MIRROR TALK
                    </h1>
                    <p className="text-violet-400/60 font-mono text-sm tracking-[0.3em] uppercase mb-4">
                        Speak It • Believe It • Become It
                    </p>
                    <button onClick={() => setShowInfo(v => !v)}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-violet-400 font-mono transition-colors border border-white/5 hover:border-violet-500/30 px-3 py-1.5 rounded-lg">
                        <Info size={13} /> How it works
                    </button>
                </motion.div>

                {/* Instructions Panel */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="dash-glass rounded-2xl p-6 mb-8 border border-violet-500/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-violet-400 font-mono uppercase tracking-widest">How to use Mirror Talk</h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-600 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            <div className="space-y-3">
                                {INSTRUCTIONS.map(({ step, text }) => (
                                    <div key={step} className="flex gap-3 items-start">
                                        <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                        <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                                <p className="text-xs text-violet-300/60 font-mono italic">💡 Science says: repeating affirmations daily for 21+ days creates new neural pathways that boost self-belief.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="dash-glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Flame size={22} className="text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#3D52A0]">{streakData.streak}</p>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Day Streak</p>
                        </div>
                    </div>
                    <div className="dash-glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <Sparkles size={22} className="text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#3D52A0]">{saidCount}<span className="text-slate-500 text-lg">/{total}</span></p>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Said Today</p>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                    <div className="mb-8">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                                initial={{ width: 0 }} animate={{ width: `${(saidCount / total) * 100}%` }} transition={{ duration: 0.5 }} />
                        </div>
                        {saidCount === total && total > 0 && (
                            <p className="text-center text-violet-400 text-xs font-mono mt-2 tracking-widest">✦ ALL DONE — AMAZING! ✦</p>
                        )}
                    </div>
                )}

                {/* Add input */}
                <div className="dash-glass rounded-2xl p-5 mb-6 flex gap-3">
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addAffirmation()}
                        placeholder="I am confident. I am capable. I am..."
                        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
                    <button onClick={addAffirmation} className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-all">
                        <Plus size={18} />
                    </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {affirmations.map((a, i) => {
                            const said = streakData.saidIds.includes(a.id);
                            return (
                                <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}
                                    className={`dash-glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${said ? "border-violet-500/30" : ""}`}
                                    onClick={() => toggleSaid(a.id)}>
                                    {said ? <CheckCircle2 size={22} className="text-violet-400 shrink-0" /> : <Circle size={22} className="text-slate-600 shrink-0" />}
                                    <p className={`flex-1 text-sm font-medium transition-all ${said ? "text-violet-300 line-through opacity-60" : "text-slate-200"}`}>{a.text}</p>
                                    <button onClick={e => { e.stopPropagation(); deleteAffirmation(a.id); }}
                                        className="text-slate-700 hover:text-red-400 transition-colors p-1"><Trash2 size={15} /></button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {!loading && total === 0 && (
                        <div className="text-center text-slate-600 py-16">
                            <Mic2 size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-mono text-sm">Add your first affirmation above.</p>
                        </div>
                    )}
                </div>

                {saidCount > 0 && (
                    <div className="text-center mt-8">
                        <button onClick={resetDaily} className="text-xs text-slate-600 hover:text-slate-400 font-mono underline transition-colors">
                            Reset today's progress
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
