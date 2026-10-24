import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Trash2, Flame, Trophy, TrendingUp, Calendar, Info } from "lucide-react";
import { supabase } from "../supabase";
import {
    Button,
    Select,
    RadioGroup,
    Textarea,
    Card,
    CardBody,
    Badge,
    KpiCard,
    Modal,
    ConfirmDialog,
    EmptyState,
    SkeletonText,
    SkeletonCard,
    useToast,
} from "./ui";

const TRIGGERS = ["Traffic", "Work", "Family", "Social", "Waiting", "Other"];
const INTENSITY_LABELS = ["", "Barely a test", "Mildly annoying", "Testing", "Hard", "Extremely hard"];
const INTENSITY_COLORS = ["", "#64748B", "#94A3B8", "#D97706", "#EA580C", "#DC2626"];

function toDateStr(iso) {
    return new Date(iso).toISOString().split("T")[0];
}

export default function PatienceMarker() {
    const toast = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [trigger, setTrigger] = useState("");
    const [intensity, setIntensity] = useState(3);
    const [note, setNote] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [justLogged, setJustLogged] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => { fetchLogs(); }, []);

    async function fetchLogs() {
        const { data } = await supabase.from("patience_logs").select("*").order("logged_at", { ascending: false });
        if (data) setLogs(data);
        setLoading(false);
    }

    async function quickLog() {
        const { data } = await supabase.from("patience_logs").insert({ logged_at: new Date().toISOString() }).select().single();
        if (data) {
            setLogs(prev => [data, ...prev]);
            toast.success("Nice — logged your patience win.");
        }
        flashLogged();
    }

    async function detailedLog() {
        const { data } = await supabase.from("patience_logs").insert({
            logged_at: new Date().toISOString(),
            trigger: trigger || null,
            intensity,
            note: note.trim() || null,
        }).select().single();
        if (data) {
            setLogs(prev => [data, ...prev]);
            toast.success("Logged with details.");
        }
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
        toast.success("Entry deleted.");
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

    const intensityOptions = [1, 2, 3, 4, 5].map(d => ({
        value: d,
        label: (
            <span style={{ color: INTENSITY_COLORS[d] }} className="font-semibold">
                {d} · {INTENSITY_LABELS[d]}
            </span>
        ),
    }));

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Heart size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Patience Marker</h1>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                    Notice it · Mark it · Build it
                </p>
                <button
                    onClick={() => setShowInfo(v => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-primary transition-colors border border-[var(--border)] hover:border-primary/40 px-3 py-1.5 rounded-lg"
                >
                    <Info size={13} /> How it works
                </button>
            </motion.div>

            <AnimatePresence>
                {showInfo && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="p-5">
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                The moment you catch yourself staying calm instead of reacting — traffic, an annoying comment, a long wait — tap the button. That's it. Building awareness of when you succeed is what trains the habit. Add details when you want to spot your patterns.
                            </p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick log action */}
            <Card className="p-6 flex flex-col items-center gap-4">
                <motion.button
                    onClick={quickLog}
                    whileTap={{ scale: 0.92 }}
                    className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1.5 border-4 border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/15"
                >
                    <Heart size={34} fill={justLogged ? "currentColor" : "none"} />
                    <span className="text-sm font-bold uppercase tracking-wide">
                        {justLogged ? "Logged!" : "I Stayed Patient"}
                    </span>
                </motion.button>
                <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setDetailsOpen(true)}>
                    Log with details instead
                </Button>
            </Card>

            {/* Details modal */}
            <Modal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title="Log the Details"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDetailsOpen(false)}>Cancel</Button>
                        <Button variant="primary" icon={<Plus size={16} />} onClick={detailedLog}>Log It</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <Select
                        label="What triggered it?"
                        value={trigger}
                        onChange={e => setTrigger(e.target.value)}
                    >
                        <option value="">No trigger / not sure</option>
                        {TRIGGERS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>

                    <RadioGroup
                        name="intensity"
                        options={intensityOptions}
                        value={intensity}
                        onChange={setIntensity}
                    />

                    <Textarea
                        label="What happened? (optional)"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={2}
                        placeholder="Describe the moment..."
                    />
                </div>
            </Modal>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard icon={<TrendingUp size={18} />} label="Today" value={todayCount} />
                <KpiCard icon={<Calendar size={18} />} label="This Week" value={weekCount} />
                <KpiCard icon={<Flame size={18} />} label="Day Streak" value={currentStreak} tone="warning" />
                <KpiCard icon={<Trophy size={18} />} label="Best Streak" value={bestStreak} tone="accent" />
            </div>

            {/* 14-day trend */}
            <Card>
                <CardBody>
                    <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-4">Last 14 Days</h3>
                    <div className="flex items-end gap-1.5 h-24">
                        {last14.map(d => (
                            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date}: ${d.count}`}>
                                <div
                                    className={`w-full rounded-t-md transition-all ${d.date === todayStr ? "bg-primary" : d.count > 0 ? "bg-primary/40" : "bg-[var(--border)]"}`}
                                    style={{
                                        height: `${(d.count / maxDay) * 100}%`,
                                        minHeight: d.count > 0 ? "6px" : "2px",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{last14[0].date.slice(5)}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">Today</span>
                    </div>
                </CardBody>
            </Card>

            {/* Trigger breakdown */}
            {triggerCounts.length > 0 && (
                <Card>
                    <CardBody>
                        <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide mb-4">Where It Happens Most</h3>
                        <div className="flex flex-col gap-2.5">
                            {triggerCounts.map(({ trigger: t, count }) => (
                                <div key={t} className="flex items-center gap-3">
                                    <span className="text-xs text-[var(--text)] font-medium w-16 shrink-0">{t}</span>
                                    <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / triggerCounts[0].count) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] font-mono w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Recent entries */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide px-1">Recent Log</h3>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        <SkeletonCard />
                        <SkeletonText lines={3} />
                    </div>
                ) : logs.length === 0 ? (
                    <EmptyState
                        icon={<Heart size={22} />}
                        title="No moments logged yet"
                        message="Next time you stay calm, mark it."
                    />
                ) : (
                    <AnimatePresence>
                        {logs.slice(0, 25).map((l, i) => (
                            <motion.div
                                key={l.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card className="p-4 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Heart size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-[var(--text-muted)] font-mono">
                                                {new Date(l.logged_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                            </span>
                                            {l.trigger && <Badge variant="primary">{l.trigger}</Badge>}
                                            {l.intensity && (
                                                <span className="text-[10px] font-mono font-semibold" style={{ color: INTENSITY_COLORS[l.intensity] }}>
                                                    {INTENSITY_LABELS[l.intensity]}
                                                </span>
                                            )}
                                        </div>
                                        {l.note && <p className="text-xs text-[var(--text-muted)] mt-1 italic">"{l.note}"</p>}
                                    </div>
                                    <button onClick={() => setConfirmDeleteId(l.id)} className="text-[var(--text-muted)] hover:text-danger transition-colors p-1 shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <ConfirmDialog
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => { deleteLog(confirmDeleteId); setConfirmDeleteId(null); }}
                title="Delete this entry?"
                message="This log entry will be permanently removed. This action cannot be undone."
                confirmLabel="Delete"
            />
        </div>
    );
}
