import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, Zap, Brain, Target, CheckCircle, AlertTriangle, Flame, MessageCircle, Send, BarChart2, Copy, Check, History, X } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const GEMINI_API_KEY = "AQ.Ab8RN6K3LNwQEJwJhaJJZmqqTMqdpplFelcUCHmfmN1o5U1kGw";
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
    { key: "assessment", label: "Overall Assessment",    color: "#22d3ee", grad: "from-cyan-500/20 to-cyan-500/5",     Icon: Brain,         glow: "rgba(61,82,160,0.15)" },
    { key: "doing_well", label: "What You're Doing Well", color: "#4ade80", grad: "from-emerald-500/20 to-emerald-500/5", Icon: CheckCircle,   glow: "rgba(74,222,128,0.15)" },
    { key: "attention",  label: "Needs Attention",        color: "#f97316", grad: "from-orange-500/20 to-orange-500/5",  Icon: AlertTriangle, glow: "rgba(249,115,22,0.15)" },
    { key: "actions",    label: "Today's Action Plan",    color: "#a78bfa", grad: "from-violet-500/20 to-violet-500/5",  Icon: Target,        glow: "rgba(112,145,230,0.15)" },
    { key: "motivation", label: "Your Personal Message",  color: "#f59e0b", grad: "from-amber-500/20 to-amber-500/5",   Icon: Flame,         glow: "rgba(245,158,11,0.15)" },
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden">
            <Navbar />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
                .ai-title { font-family: 'Syne', sans-serif; }
                .ai-body  { font-family: 'Inter', sans-serif; }
                .glass-card {
                    background: rgba(255,255,255,0.5);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .orb1 { position:fixed; top:-20%; left:-10%; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }
                .orb2 { position:fixed; bottom:-20%; right:-10%; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }
                .orb3 { position:fixed; top:40%; left:50%; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%); pointer-events:none; z-index:0; transform:translateX(-50%); }
                @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.08);opacity:0.8} }
                .pulse-ring { animation: pulse-ring 2.5s ease-in-out infinite; }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                .shimmer-text {
                    background: linear-gradient(90deg, #fff 0%, #22d3ee 30%, #a78bfa 60%, #fff 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                    animation: shimmer 4s linear infinite;
                }
                .section-content p { margin-bottom: 0.5rem; }
                .section-content ul { list-style: none; padding: 0; }
                .section-content li { padding: 0.35rem 0; padding-left: 1.2rem; position: relative; }
                .section-content li::before { content: "›"; position: absolute; left: 0; opacity: 0.5; }
            `}</style>

            {/* Background orbs */}
            <div className="orb1" /><div className="orb2" /><div className="orb3" />

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-14 ai-body">

                {/* Tab Switcher */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="flex gap-2 glass-card rounded-2xl p-1.5 mb-8 border border-white/5">
                    {[{ id: "analysis", label: "Analysis", Icon: BarChart2 }, { id: "chat", label: "Chat", Icon: MessageCircle }].map(({ id, label, Icon }) => (
                        <button key={id} onClick={() => setTab(id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200"
                            style={tab === id
                                ? { background: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(61,82,160,0.3)" }
                                : { color: "#475569", border: "1px solid transparent" }}>
                            <Icon size={15} />{label}
                        </button>
                    ))}
                </motion.div>

                {/* Header */}
                <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="text-center mb-14">

                    {/* Icon with pulse rings */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="pulse-ring absolute w-24 h-24 rounded-full border border-cyan-500/20" />
                        <div className="pulse-ring absolute w-32 h-32 rounded-full border border-cyan-500/10" style={{ animationDelay: "0.4s" }} />
                        <div className="relative w-16 h-16 rounded-2xl glass-card flex items-center justify-center border border-cyan-500/30"
                            style={{ boxShadow: "0 0 40px rgba(34,211,238,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                            <Bot size={28} className="text-cyan-400" />
                        </div>
                    </div>

                    <h1 className="ai-title shimmer-text text-5xl md:text-6xl font-extrabold tracking-tight mb-3">
                        AI COACH
                    </h1>
                    <p className="text-slate-500 text-sm tracking-[0.25em] uppercase font-medium mb-1">
                        Your Personal Intelligence Layer
                    </p>
                    <p className="text-slate-700 text-xs font-mono">Gemini · 3.6 Flash</p>
                </motion.div>

                {/* Info strip */}
                {tab === "analysis" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-4 mb-8 flex items-center gap-4 border border-white/5">
                    <div className="flex gap-2 flex-wrap">
                        {["Todos","Mood","Habits","Journal","Skills","Books","Fears","Affirmations","Comfort Zone","Money","Rewards","Goals","Plans","Friends"].map(tag => (
                            <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-cyan-500/20 text-cyan-400/70 bg-cyan-500/5 tracking-wider uppercase">{tag}</span>
                        ))}
                    </div>
                </motion.div>}

                {/* CTA Button */}
                {tab === "analysis" && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={runAnalysis} disabled={loading}
                            className="relative group inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            style={{ background: "linear-gradient(135deg, rgba(61,82,160,0.15) 0%, rgba(112,145,230,0.15) 100%)", border: "1px solid rgba(61,82,160,0.3)", color: "#3D52A0", boxShadow: loading ? "none" : "0 0 40px rgba(61,82,160,0.12), 0 0 80px rgba(112,145,230,0.08)" }}>
                            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {loading
                                ? <><Loader2 size={18} className="animate-spin text-cyan-400" /><span className="text-cyan-300">Analysing your day...</span></>
                                : analysis
                                    ? <><RefreshCw size={18} className="text-cyan-400" /><span>Re-analyse</span></>
                                    : <><Sparkles size={18} className="text-cyan-400" /><span>Analyse My Day</span><Zap size={14} className="text-violet-400" /></>
                            }
                        </button>
                        {analysisHistory.length > 0 && (
                            <button onClick={() => setShowHistory(v => !v)} title="History"
                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                                style={{ background: showHistory ? "rgba(112,145,230,0.15)" : "rgba(255,255,255,0.04)", border: showHistory ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                                <History size={16} className={showHistory ? "text-violet-400" : "text-slate-500"} />
                            </button>
                        )}
                        {analysis && (
                            <button onClick={copyAll} title="Copy all"
                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {copiedKey === "all" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-500" />}
                            </button>
                        )}
                    </div>
                    {lastRun && (
                        <p className="text-xs text-slate-700 font-mono mt-3 flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Last analysed at {lastRun}
                        </p>
                    )}
                </motion.div>}

                {/* History Panel */}
                <AnimatePresence>
                {tab === "analysis" && showHistory && analysisHistory.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="glass-card rounded-2xl border border-violet-500/20 mb-6 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <span className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center gap-2"><History size={13} />History</span>
                            <button onClick={() => setShowHistory(false)}><X size={14} className="text-slate-600" /></button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {analysisHistory.map((h, i) => (
                                <button key={i} onClick={() => { setAnalysis(h.parsed); setLastRun(h.time); setOpen({ assessment: true, doing_well: true, attention: true, actions: true, motivation: true }); setShowHistory(false); }}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                                    <span className="text-xs text-slate-400">{h.date} · {h.time}</span>
                                    <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Restore</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Error */}
                {tab === "analysis" && error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl p-4 mb-6 border border-red-500/30 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-red-400 shrink-0" />
                        <p className="text-red-400 text-sm font-mono">{error}</p>
                    </motion.div>
                )}

                {/* Loading skeleton */}
                {tab === "analysis" && loading && (
                    <div className="space-y-4">
                        {SECTIONS.map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                className="glass-card rounded-2xl p-5 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-slate-800" />
                                    <div className="h-3.5 bg-slate-800 rounded-full w-36" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2.5 bg-slate-800/70 rounded-full w-full" />
                                    <div className="h-2.5 bg-slate-800/70 rounded-full w-5/6" />
                                    <div className="h-2.5 bg-slate-800/70 rounded-full w-4/6" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Chat Mode */}
                <AnimatePresence mode="wait">
                {tab === "chat" && (
                    <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="glass-card rounded-2xl border border-white/5 flex flex-col" style={{ height: "520px" }}>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {msg.role === "assistant" && (
                                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5"
                                                style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(61,82,160,0.3)" }}>
                                                <Bot size={13} className="text-cyan-400" />
                                            </div>
                                        )}
                                        <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-6 whitespace-pre-wrap"
                                            style={msg.role === "user"
                                                ? { background: "rgba(112,145,230,0.15)", border: "1px solid rgba(112,145,230,0.3)", color: "#3D52A0" }
                                                : { background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)", color: "#3D52A0" }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2"
                                            style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(61,82,160,0.3)" }}>
                                            <Bot size={13} className="text-cyan-400" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                            <Loader2 size={15} className="animate-spin text-cyan-400" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            {/* Quick Ask */}
                            <div className="px-4 pt-3 pb-2 flex gap-2 flex-wrap border-t border-white/5">
                                {["How are my habits?", "Rate my week", "What to focus on?", "Money advice", "Motivate me"].map(q => (
                                    <button key={q} type="button" onClick={() => quickAsk(q)}
                                        className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all duration-200"
                                        style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.18)", color: "#67e8f9" }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                            {/* Input */}
                            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-3">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    placeholder="Ask your coach anything..."
                                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none px-4 py-2.5 rounded-xl"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                                <button type="submit" disabled={chatLoading || !chatInput.trim()}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40"
                                    style={{ background: "rgba(61,82,160,0.15)", border: "1px solid rgba(34,211,238,0.3)" }}>
                                    <Send size={15} className="text-cyan-400" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {tab === "analysis" && analysis && !loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {SECTIONS.map(({ key, label, color, grad, Icon, glow }, idx) => {
                                const content = analysis[key];
                                if (!content) return null;
                                const isOpen = open[key];
                                return (
                                    <motion.div key={key}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                                        className="glass-card rounded-2xl overflow-hidden transition-all duration-300"
                                        style={{ borderColor: color + "25", boxShadow: isOpen ? `0 0 30px ${glow}` : "none" }}>

                                        {/* Header */}
                                        <div className={`flex items-center bg-gradient-to-r ${grad}`}>
                                            <button onClick={() => toggle(key)} className="flex-1 flex items-center gap-3 px-5 py-4 text-left">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                    style={{ background: color + "20", border: `1px solid ${color}30` }}>
                                                    <Icon size={15} style={{ color }} />
                                                </div>
                                                <span className="ai-title font-bold text-sm tracking-wide" style={{ color }}>{label}</span>
                                            </button>
                                            <div className="flex items-center gap-1.5 pr-4">
                                                <button onClick={() => copySection(key, content)}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                                    style={{ background: color + "15", border: `1px solid ${color}20` }}>
                                                    {copiedKey === key ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} style={{ color }} />}
                                                </button>
                                                <button onClick={() => toggle(key)}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                    style={{ background: color + "15", border: `1px solid ${color}20` }}>
                                                    {isOpen ? <ChevronUp size={13} style={{ color }} /> : <ChevronDown size={13} style={{ color }} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                                    <div className="px-5 py-5 border-t" style={{ borderColor: color + "15" }}>
                                                        <div className="section-content text-sm text-slate-300 leading-7 whitespace-pre-wrap"
                                                            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>
                                                            {content}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}

                            {/* Footer */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className="text-center pt-4 pb-2">
                                <p className="text-xs text-slate-700 font-mono">Analysis generated by Gemini · 3.6 Flash · {new Date().toLocaleDateString()}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
