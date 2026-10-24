import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, Info, X, TrendingUp, Star, Calendar } from "lucide-react";
import { supabase } from "../supabase";
import { Button, IconButton, Input, Textarea, Badge, KpiCard, Card, CardHeader, CardBody, EmptyState, SkeletonCard, cn } from "./ui";

const INSTRUCTIONS = [
    { step: "1", text: "Log anything you did that felt uncomfortable or scary — big or small." },
    { step: "2", text: "Rate the difficulty from 1 (slightly uncomfortable) to 5 (terrifying but did it)." },
    { step: "3", text: "Add a short reflection: what did you learn or feel after doing it?" },
    { step: "4", text: "Review your log regularly — you'll be amazed how much you've grown." },
];

const DIFF_LABELS = ["", "Slightly Uncomfortable", "Challenging", "Hard", "Very Hard", "Terrifying"];
const DIFF_VARIANTS = ["", "info", "primary", "warning", "warning", "danger"];

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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 bg-warning/10 text-warning">
                    <Zap size={28} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-1 tracking-tight">
                    Comfort Zone
                </h1>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                    Push It • Log It • Grow From It
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
                                title="How to use Comfort Zone Log"
                                action={<IconButton label="Close" size="sm" onClick={() => setShowInfo(false)}><X size={16} /></IconButton>}
                            />
                            <CardBody className="flex flex-col gap-4">
                                <div className="space-y-3">
                                    {INSTRUCTIONS.map(({ step, text }) => (
                                        <div key={step} className="flex gap-3 items-start">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 rounded-xl bg-warning/5 border border-warning/15">
                                    <p className="text-xs text-warning italic">Growth happens at the edge of your comfort zone. Every uncomfortable action you take expands who you are.</p>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard icon={<TrendingUp size={18} />} label="Total Pushes" value={entries.length} tone="primary" />
                <KpiCard icon={<Star size={18} />} label="Courage Points" value={totalPoints} tone="accent" />
                <KpiCard icon={<Zap size={18} />} label="Avg Difficulty" value={avgDiff} tone="warning" />
            </div>

            {/* Add form */}
            <Card>
                <CardHeader title="Log a Comfort Zone Push" />
                <CardBody className="flex flex-col gap-4">
                    <Input
                        value={action}
                        onChange={e => setAction(e.target.value)}
                        placeholder="What did you do that was outside your comfort zone?"
                    />

                    <div>
                        <p className="text-sm font-medium text-[var(--text)] mb-2">
                            Difficulty: <span className="font-normal text-[var(--text-muted)]">{DIFF_LABELS[difficulty]}</span>
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDifficulty(d)}
                                    className={cn(
                                        "flex-1 py-2 rounded-[10px] text-sm font-semibold border transition-colors",
                                        difficulty >= d
                                            ? "bg-primary text-white border-primary"
                                            : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Textarea
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                        placeholder="Reflection: How did it feel? What did you learn? (optional)"
                        rows={2}
                        autoResize={false}
                    />

                    <Button icon={<Plus size={16} />} onClick={addEntry} className="w-full">
                        Log Push
                    </Button>
                </CardBody>
            </Card>

            {/* Entries */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : entries.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={<Zap size={22} />}
                            title="No pushes logged yet"
                            message="Do something uncomfortable today."
                        />
                    </Card>
                ) : (
                    <AnimatePresence>
                        {entries.map((e, i) => (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                                <Card className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg bg-primary/10 text-primary">
                                            {e.difficulty}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text)] mb-1">{e.action}</p>
                                            {e.reflection && <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2 italic">"{e.reflection}"</p>}
                                            <div className="flex items-center gap-3">
                                                <Badge variant={DIFF_VARIANTS[e.difficulty]}>{DIFF_LABELS[e.difficulty]}</Badge>
                                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <Calendar size={11} /> {e.done_at}
                                                </span>
                                            </div>
                                        </div>
                                        <IconButton label="Delete" variant="danger" size="sm" onClick={() => deleteEntry(e.id)} className="shrink-0">
                                            <Trash2 size={15} />
                                        </IconButton>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
