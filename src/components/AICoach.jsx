import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, RefreshCw, ChevronDown, ChevronUp, Brain, Target, CheckCircle, AlertTriangle, Flame, MessageCircle, Send, Copy, Check, History, X, User } from "lucide-react";
import { supabase } from "../supabase";
import { Button, IconButton, Input, Card, CardHeader, CardBody, Badge, Tabs, EmptyState, SkeletonText } from "./ui";

const ICON_TOKENS = {
    primary: "bg-primary/10 text-primary",
    success: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
};

const GEMINI_API_KEY = "AQ.Ab8RN6LW2yl3vp7Aib0zssqdloHPwuKr3DFqsVPzwxQR9vhoHA";
const TODAY = new Date().toISOString().split("T")[0];


async function fetchAllData() {
    const [
        { data: todos }, { data: mood }, { data: habits }, { data: habitLogs },
        { data: journal }, { data: skills }, { data: skillRatings }, { data: books },
        { data: affirmations }, { data: fears }, { data: comfortZone }, { data: money },
        { data: rewards }, { data: achievements }, { data: plans }, { data: friends },
    ] = await Promise.all([
        supabase.from("ToDo").select("title,completed").eq("active", true).gte("created_at", `${TODAY}T00:00:00`).lte("created_at", `${TODAY}T23:59:59`),
        supabase.from("mood_tracker").select("mood,note,date").order("date", { ascending: false }).limit(7),
        supabase.from("habits").select("name,color").eq("active", true),
        supabase.from("habit_logs").select("habit_id,date,done").gte("date", (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; })()),
        supabase.from("journal_entries").select("title,content,date").order("date", { ascending: false }).limit(3),
        supabase.from("skills").select("id,name").eq("active", true),
        supabase.from("skill_ratings").select("skill_id,rating,rated_at").order("rated_at", { ascending: false }).limit(20),
        supabase.from("books_tracker").select("title,status,current_page,total_pages").order("created_at", { ascending: false }).limit(5),
        supabase.from("mirror_talk").select("text"),
        supabase.from("fear_crusher").select("fear,challenge,conquered"),
        supabase.from("comfort_zone").select("action,difficulty,reflection,done_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("money_transactions").select("title,amount,type,category,date").order("date", { ascending: false }).limit(10),
        supabase.from("rewards").select("reward_title,reward_type,week_count,unlocked").order("week_count"),
        supabase.from("achievements").select("title,target_value,start_date,target_date").order("created_at", { ascending: false }).limit(5),
        supabase.from("plans").select("title,category,priority,status,start_date,end_date").order("created_at", { ascending: false }).limit(5),
        supabase.from("friends").select("name,priority_level").order("priority_level"),
    ]);
    return { todos, mood, habits, habitLogs, journal, skills, skillRatings, books, affirmations, fears, comfortZone, money, rewards, achievements, plans, friends };
}

function buildPrompt(data) {
    const { todos, mood, habits, habitLogs, journal, skills, skillRatings, books, affirmations, fears, comfortZone, money, rewards, achievements, plans, friends } = data;
    const completedTodos = (todos || []).filter(t => t.completed);
    const pendingTodos = (todos || []).filter(t => !t.completed);
    const conqueredFears = (fears || []).filter(f => f.conquered).length;
    const totalFears = (fears || []).length;
    const habitSummary = (habits || []).map(h => {
        const logs = (habitLogs || []).filter(l => l.habit_id === h.id);
        const doneCount = logs.filter(l => l.done).length;
        const todayDone = logs.find(l => l.date === TODAY)?.done;
        return `${h.name}: ${doneCount}/7 days this week, today: ${todayDone ? "done" : "not done"}`;
    });
    const skillSummary = (skills || []).map(s => {
        const ratings = (skillRatings || []).filter(r => r.skill_id === s.id);
        const latest = ratings[0]?.rating || 0;
        return `${s.name}: ${latest}/10`;
    });
    const recentJournal = (journal || [])[0];
    const readingBooks = (books || []).filter(b => b.status === "reading" || b.status === "learning");
    const recentComfort = (comfortZone || []).slice(0, 3);
    const totalIncome = (money || []).filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = (money || []).filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const unlockedRewards = (rewards || []).filter(r => r.unlocked).length;
    const activePlans = (plans || []).filter(p => p.status !== "completed" && p.status !== "cancelled");
    const bestFriends = (friends || []).filter(f => f.priority_level <= 2).map(f => f.name);

    return `You are a personal life coach AI. Analyse the following data about my day and life progress, then give me:
1. A short honest assessment of how I'm doing (2-3 sentences)
2. What I'm doing well (bullet points)
3. What needs urgent attention (bullet points)
4. 3 specific action instructions for TODAY
5. One powerful motivational message personalised to my situation

Be direct, honest, and motivating. Don't be generic. Use the actual data.

--- MY DATA ---
TODAY'S TASKS (${TODAY}):
- Completed: ${completedTodos.map(t => t.title).join(", ") || "none"}
- Pending: ${pendingTodos.map(t => t.title).join(", ") || "none"}
- Completion rate: ${todos?.length ? Math.round((completedTodos.length / todos.length) * 100) : 0}%

MOOD (last 7 days):
${(mood || []).map(m => `${m.date}: ${m.mood}/5${m.note ? ` - "${m.note}"` : ""}`).join("\n") || "No mood data"}

HABITS (this week):
${habitSummary.join("\n") || "No habits tracked"}

JOURNAL (latest entry):
${recentJournal ? `Date: ${recentJournal.date}\nTitle: ${recentJournal.title || "Untitled"}\nContent: ${recentJournal.content?.slice(0, 300)}...` : "No journal entries"}

SKILLS: ${skillSummary.join(", ") || "No skills tracked"}

BOOKS/LEARNING: ${readingBooks.map(b => `${b.title} (${b.status}) - ${b.current_page || 0}/${b.total_pages || "?"} pages`).join(", ") || "None active"}

AFFIRMATIONS: ${(affirmations || []).map(a => a.text).join(" | ") || "None set"}

FEARS: Total: ${totalFears}, Conquered: ${conqueredFears}, Active: ${(fears || []).filter(f => !f.conquered).map(f => f.fear).join(", ") || "none"}

COMFORT ZONE PUSHES (recent): ${recentComfort.map(c => `"${c.action}" (${c.difficulty}/5)`).join(", ") || "None logged"}

MONEY: Income ₹${totalIncome.toLocaleString()}, Expenses ₹${totalExpense.toLocaleString()}, Balance ₹${(totalIncome - totalExpense).toLocaleString()}

REWARDS: ${unlockedRewards} unlocked out of ${(rewards || []).length} total

ACHIEVEMENTS/GOALS:
${(achievements || []).map(a => `- ${a.title}: target ${a.target_value}, deadline ${a.target_date || "none"}`).join("\n") || "No goals set"}

ACTIVE PLANS:
${activePlans.map(p => `- ${p.title} (priority: ${p.priority === 1 ? "High" : p.priority === 2 ? "Medium" : "Low"}, category: ${p.category || "none"})`).join("\n") || "No active plans"}

CLOSE FRIENDS/NETWORK: ${bestFriends.join(", ") || "None added"} (${(friends || []).length} total connections)
--- END DATA ---

Now give me my personalised daily analysis and instructions.`;
}

const SECTIONS = [
    { key: "assessment", label: "Overall Assessment",    Icon: Brain,         badge: "primary" },
    { key: "doing_well", label: "What You're Doing Well", Icon: CheckCircle,   badge: "success" },
    { key: "attention",  label: "Needs Attention",        Icon: AlertTriangle, badge: "warning" },
    { key: "actions",    label: "Today's Action Plan",    Icon: Target,        badge: "info" },
    { key: "motivation", label: "Your Personal Message",  Icon: Flame,         badge: "success" },
];

function parseResponse(text) {
    const sections = {};
    const lines = text.split("\n");
    let current = null;
    let buffer = [];
    const markers = { "1.": "assessment", "2.": "doing_well", "3.": "attention", "4.": "actions", "5.": "motivation" };
    for (const line of lines) {
        const trimmed = line.trim();
        const marker = Object.keys(markers).find(m => trimmed.startsWith(m));
        if (marker) {
            if (current) sections[current] = buffer.join("\n").trim();
            current = markers[marker];
            buffer = [trimmed.replace(/^\d+\.\s*/, "").replace(/^\*\*.*?\*\*\s*/, "").trim()];
        } else if (current) {
            buffer.push(trimmed);
        }
    }
    if (current) sections[current] = buffer.join("\n").trim();
    if (Object.keys(sections).length === 0) sections.assessment = text;
    return sections;
}

async function callGemini(messages) {
    const systemMsg = messages.find(m => m.role === "system");
    const contents = messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const body = {
        contents,
        ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text;
}

export default function AICoach() {
    const [tab, setTab] = useState("analysis");
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState({});
    const [lastRun, setLastRun] = useState(null);
    const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "Hey! I'm your AI Coach. Ask me anything about your goals, habits, progress, or life in general. 💪" }]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatData, setChatData] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

    async function sendMessage(e) {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || chatLoading) return;
        setChatInput("");
        const userMsg = { role: "user", content: text };
        setChatMessages(prev => [...prev, userMsg]);
        setChatLoading(true);
        try {
            let data = chatData;
            if (!data) { data = await fetchAllData(); setChatData(data); }
            const systemPrompt = `You are a personal AI life coach. You have access to the user's data:\n${buildPrompt(data)}\n\nAnswer the user's questions directly and helpfully. Be concise, honest, and motivating.`;
            const history = [...chatMessages, userMsg].filter(m => m.role !== "system");
            const reply = await callGemini([{ role: "system", content: systemPrompt }, ...history]);
            setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
        } finally {
            setChatLoading(false);
        }
    }

    async function runAnalysis() {
        if (!GEMINI_API_KEY) { setError("Gemini API key not found."); return; }
        setLoading(true); setError(null); setAnalysis(null);
        try {
            const data = await fetchAllData();
            const prompt = buildPrompt(data);
            const text = await callGemini([{ role: "user", content: prompt }]);
            if (!text) throw new Error("No response from AI");
            const parsed = parseResponse(text);
            const ts = new Date();
            setAnalysis(parsed);
            setLastRun(ts.toLocaleTimeString());
            setAnalysisHistory(prev => [{ parsed, time: ts.toLocaleTimeString(), date: ts.toLocaleDateString() }, ...prev].slice(0, 10));
            setOpen({ assessment: true, doing_well: true, attention: true, actions: true, motivation: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function toggle(key) { setOpen(prev => ({ ...prev, [key]: !prev[key] })); }

    function copySection(key, content) {
        navigator.clipboard.writeText(content);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    }

    function copyAll() {
        const text = SECTIONS.map(s => analysis[s.key] ? `## ${s.label}\n${analysis[s.key]}` : "").filter(Boolean).join("\n\n");
        navigator.clipboard.writeText(text);
        setCopiedKey("all");
        setTimeout(() => setCopiedKey(null), 2000);
    }

    function quickAsk(q) { setChatInput(q); }

    const TAB_ITEMS = [
        { value: "analysis", label: "Analysis" },
        { value: "chat", label: "Chat" },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Bot size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">AI Coach</h1>
                <p className="text-sm text-[var(--text-muted)]">Your personal intelligence layer</p>
            </motion.div>

            {/* Tabs */}
            <Tabs tabs={TAB_ITEMS} value={tab} onChange={setTab} className="justify-center" />

            {tab === "analysis" && (
                <>
                    {/* Info strip */}
                    <Card>
                        <CardBody className="flex gap-2 flex-wrap">
                            {["Todos", "Mood", "Habits", "Journal", "Skills", "Books", "Fears", "Affirmations", "Comfort Zone", "Money", "Rewards", "Goals", "Plans", "Friends"].map(tag => (
                                <Badge key={tag} variant="primary">{tag}</Badge>
                            ))}
                        </CardBody>
                    </Card>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={runAnalysis}
                                loading={loading}
                                icon={!loading ? (analysis ? <RefreshCw size={18} /> : <Sparkles size={18} />) : undefined}
                            >
                                {loading ? "Analysing your day..." : analysis ? "Re-analyse" : "Analyse My Day"}
                            </Button>
                            {analysisHistory.length > 0 && (
                                <IconButton
                                    label="History"
                                    variant={showHistory ? "primary" : "default"}
                                    onClick={() => setShowHistory(v => !v)}
                                >
                                    <History size={16} />
                                </IconButton>
                            )}
                            {analysis && (
                                <IconButton label="Copy all" onClick={copyAll}>
                                    {copiedKey === "all" ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
                                </IconButton>
                            )}
                        </div>
                        {lastRun && (
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                                Last analysed at {lastRun}
                            </p>
                        )}
                    </div>

                    {/* History Panel */}
                    <AnimatePresence>
                        {showHistory && analysisHistory.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <Card>
                                    <CardHeader
                                        title="History"
                                        icon={<History size={16} />}
                                        action={
                                            <IconButton label="Close" size="sm" onClick={() => setShowHistory(false)}>
                                                <X size={14} />
                                            </IconButton>
                                        }
                                    />
                                    <div className="divide-y divide-[var(--border)]">
                                        {analysisHistory.map((h, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setAnalysis(h.parsed); setLastRun(h.time); setOpen({ assessment: true, doing_well: true, attention: true, actions: true, motivation: true }); setShowHistory(false); }}
                                                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors"
                                            >
                                                <span className="text-xs text-[var(--text-muted)]">{h.date} · {h.time}</span>
                                                <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Restore</span>
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl p-4 border border-danger/30 bg-danger/5 flex items-center gap-3">
                            <AlertTriangle size={16} className="text-danger shrink-0" />
                            <p className="text-danger text-sm">{error}</p>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="flex flex-col gap-4">
                            {SECTIONS.map((s, i) => (
                                <Card key={i}>
                                    <CardBody className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-[var(--surface-hover)]" />
                                            <div className="h-3.5 bg-[var(--surface-hover)] rounded-full w-36" />
                                        </div>
                                        <SkeletonText lines={3} />
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {analysis && !loading && (
                        <div className="flex flex-col gap-4">
                            {SECTIONS.map((section, idx) => {
                                const { key, label, badge } = section;
                                const content = analysis[key];
                                if (!content) return null;
                                const isOpen = open[key];
                                return (
                                    <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <Card>
                                            <div className="flex items-center">
                                                <button onClick={() => toggle(key)} className="flex-1 flex items-center gap-3 px-5 py-4 text-left">
                                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ICON_TOKENS[badge]}`}>
                                                        <section.Icon size={15} />
                                                    </span>
                                                    <span className="font-semibold text-sm text-[var(--text)]">{label}</span>
                                                </button>
                                                <div className="flex items-center gap-1.5 pr-4">
                                                    <IconButton label="Copy section" size="sm" onClick={() => copySection(key, content)}>
                                                        {copiedKey === key ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                                                    </IconButton>
                                                    <IconButton label={isOpen ? "Collapse" : "Expand"} size="sm" onClick={() => toggle(key)}>
                                                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </IconButton>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                        <div className="px-5 py-5 border-t border-[var(--border)]">
                                                            <div className="text-sm text-[var(--text)] leading-7 whitespace-pre-wrap">{content}</div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </motion.div>
                                );
                            })}

                            <p className="text-center text-xs text-[var(--text-muted)] pt-2">
                                Analysis generated by Gemini · 3.6 Flash · {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {!analysis && !loading && !error && (
                        <EmptyState
                            icon={<Sparkles size={22} />}
                            title="No analysis yet"
                            message="Run an analysis to get a personalised breakdown of your day and life progress."
                        />
                    )}
                </>
            )}

            {tab === "chat" && (
                <Card className="flex flex-col" style={{ height: "560px" }}>
                    <CardHeader title="Chat with your Coach" icon={<MessageCircle size={16} />} />

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                        {chatMessages.length === 0 ? (
                            <EmptyState
                                icon={<Bot size={22} />}
                                title="No messages yet"
                                message="Ask your coach anything about your goals, habits, or progress."
                            />
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 bg-primary/10 text-primary">
                                            <Bot size={13} />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-6 whitespace-pre-wrap ${
                                            msg.role === "user" ? "bg-primary text-white" : "bg-[var(--surface-hover)] text-[var(--text)]"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2 mt-0.5 bg-secondary/10 text-secondary">
                                            <User size={13} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 bg-primary/10 text-primary">
                                    <Bot size={13} />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-[var(--surface-hover)] w-40">
                                    <SkeletonText lines={2} />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Ask */}
                    <div className="px-4 pt-3 pb-2 flex gap-2 flex-wrap border-t border-[var(--border)]">
                        {["How are my habits?", "Rate my week", "What to focus on?", "Money advice", "Motivate me"].map(q => (
                            <button
                                key={q}
                                type="button"
                                onClick={() => quickAsk(q)}
                                className="text-[11px] px-3 py-1.5 rounded-full font-medium bg-primary/5 border border-primary/15 text-primary hover:bg-primary/10 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border)] flex gap-3 items-start">
                        <div className="flex-1">
                            <Input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Ask your coach anything..."
                            />
                        </div>
                        <Button type="submit" disabled={chatLoading || !chatInput.trim()} icon={<Send size={15} />} aria-label="Send message">
                            Send
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
}
