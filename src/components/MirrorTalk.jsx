import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Plus, Trash2, CheckCircle2, Circle, Flame, Sparkles, Info, X } from "lucide-react";
import { supabase } from "../supabase";
import { Button, IconButton, Input, Card, CardHeader, CardBody, Badge, KpiCard, EmptyState, SkeletonCard } from "./ui";

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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Mic2 size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Mirror Talk</h1>
                <p className="text-sm text-[var(--text-muted)] mb-4">Speak it. Believe it. Become it.</p>
                <Button variant="ghost" size="sm" icon={<Info size={14} />} onClick={() => setShowInfo(v => !v)}>
                    How it works
                </Button>
            </motion.div>

            {/* Instructions Panel */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card>
                            <CardHeader
                                title="How to use Mirror Talk"
                                action={
                                    <IconButton label="Close" size="sm" onClick={() => setShowInfo(false)}>
                                        <X size={16} />
                                    </IconButton>
                                }
                            />
                            <CardBody className="flex flex-col gap-3">
                                {INSTRUCTIONS.map(({ step, text }) => (
                                    <div key={step} className="flex gap-3 items-start">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{text}</p>
                                    </div>
                                ))}
                                <div className="mt-1 p-3 rounded-lg bg-accent/5 border border-accent/10">
                                    <p className="text-xs text-accent">Science says: repeating affirmations daily for 21+ days creates new neural pathways that boost self-belief.</p>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <KpiCard icon={<Flame size={18} />} label="Day Streak" value={streakData.streak} tone="warning" />
                    <KpiCard
                        icon={<Sparkles size={18} />}
                        label="Said Today"
                        value={saidCount}
                        unit={`/ ${total}`}
                        tone="accent"
                        progress={total > 0 ? (saidCount / total) * 100 : 0}
                    />
                </div>
            )}

            {saidCount === total && total > 0 && (
                <div className="text-center">
                    <Badge variant="success">All done — amazing!</Badge>
                </div>
            )}

            {/* Add input */}
            <Card>
                <CardBody className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addAffirmation()}
                            placeholder="I am confident. I am capable. I am..."
                        />
                    </div>
                    <Button variant="primary" icon={<Plus size={18} />} onClick={addAffirmation}>
                        Add
                    </Button>
                </CardBody>
            </Card>

            {/* List */}
            <Card>
                <CardHeader title="Your Affirmations" subtitle={`${total} total`} />
                <CardBody className="p-0">
                    {!loading && total === 0 ? (
                        <EmptyState
                            icon={<Mic2 size={24} />}
                            title="No affirmations yet"
                            message="Add your first affirmation above."
                        />
                    ) : (
                        <div className="divide-y divide-[var(--border)]">
                            <AnimatePresence>
                                {affirmations.map((a, i) => {
                                    const said = streakData.saidIds.includes(a.id);
                                    return (
                                        <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}
                                            className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                                            onClick={() => toggleSaid(a.id)}>
                                            {said
                                                ? <CheckCircle2 size={20} className="text-accent shrink-0" />
                                                : <Circle size={20} className="text-[var(--text-muted)] shrink-0" />}
                                            <p className={`flex-1 text-sm ${said ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}`}>{a.text}</p>
                                            <IconButton
                                                variant="danger"
                                                size="sm"
                                                label="Delete"
                                                onClick={e => { e.stopPropagation(); deleteAffirmation(a.id); }}>
                                                <Trash2 size={15} />
                                            </IconButton>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </CardBody>
            </Card>

            {saidCount > 0 && (
                <div className="text-center">
                    <Button variant="ghost" size="sm" onClick={resetDaily}>
                        Reset today's progress
                    </Button>
                </div>
            )}
        </div>
    );
}
