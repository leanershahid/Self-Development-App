import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Trash2, ShieldCheck, Shield, Info, X, Trophy } from "lucide-react";
import { supabase } from "../supabase";
import { Button, IconButton, Input, Card, CardHeader, CardBody, Badge, KpiCard, EmptyState, SkeletonCard } from "./ui";

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[var(--bg)]">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger/10 text-danger mb-4">
                        <Swords size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight mb-1">Fear Crusher</h1>
                    <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.2em] mb-4">
                        Face It · Fight It · Conquer It
                    </p>
                    <Button variant="ghost" size="sm" icon={<Info size={14} />} onClick={() => setShowInfo(v => !v)}>
                        How it works
                    </Button>
                </div>

                {/* Instructions */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card>
                                <CardHeader
                                    title="How to use Fear Crusher"
                                    action={<IconButton label="Close" size="sm" onClick={() => setShowInfo(false)}><X size={16} /></IconButton>}
                                />
                                <CardBody className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3">
                                        {INSTRUCTIONS.map(({ step, text }) => (
                                            <div key={step} className="flex gap-3 items-start">
                                                <span className="w-6 h-6 rounded-full bg-danger/10 text-danger text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 rounded-xl bg-danger/5 border border-danger/10">
                                        <p className="text-xs text-danger/80 italic">
                                            Courage is not the absence of fear — it's taking action despite it. Each conquest rewires your brain to be bolder.
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <KpiCard icon={<Trophy size={18} />} label="Fears Conquered" value={conquered} tone="danger" />
                    <Card className="p-5 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: level.color + "1A", color: level.color }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-bold truncate" style={{ color: level.color }}>{level.label}</p>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Courage Level</p>
                        </div>
                    </Card>
                </div>

                {/* Add form */}
                <Card>
                    <CardHeader title="Add a New Fear" />
                    <CardBody className="flex flex-col gap-3">
                        <Input
                            value={fear}
                            onChange={e => setFear(e.target.value)}
                            placeholder="My fear is... (e.g. speaking in public)"
                        />
                        <Input
                            value={challenge}
                            onChange={e => setChallenge(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addFear()}
                            placeholder="My challenge to face it... (e.g. speak for 1 min in front of mirror)"
                        />
                        <Button variant="danger" className="w-full justify-center" icon={<Plus size={16} />} onClick={addFear}>
                            Add Fear
                        </Button>
                    </CardBody>
                </Card>

                {/* Fear list */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <AnimatePresence>
                            {fears.map((f, i) => (
                                <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                                    <Card className="p-5">
                                        <div className="flex items-start gap-4">
                                            <button onClick={() => toggleConquered(f.id, f.conquered)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                                                {f.conquered
                                                    ? <ShieldCheck size={24} className="text-accent" />
                                                    : <Shield size={24} className="text-[var(--text-muted)]" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold mb-1 ${f.conquered ? "line-through text-[var(--text-muted)]" : "text-[var(--text)]"}`}>{f.fear}</p>
                                                <p className={`text-xs leading-relaxed ${f.conquered ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                                                    <span className="text-danger/70 font-medium">Challenge: </span>{f.challenge}
                                                </p>
                                                {f.conquered && (
                                                    <Badge variant="success" className="mt-2">Conquered</Badge>
                                                )}
                                            </div>
                                            <IconButton label="Delete" variant="danger" size="sm" onClick={() => deleteFear(f.id)}>
                                                <Trash2 size={15} />
                                            </IconButton>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    {!loading && fears.length === 0 && (
                        <EmptyState
                            icon={<Swords size={24} />}
                            title="No fears logged yet"
                            message="Be honest — what's holding you back?"
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
}
