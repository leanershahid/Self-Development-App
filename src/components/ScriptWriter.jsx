import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase";
import {
    FileText, Plus, Trash2, Save, Copy, Check, Sparkles,
    X, Download, Clock, Tag, Search, Wand2, AlignLeft, List, Hash,
    Bold, Italic, RotateCcw, Eye, EyeOff, ArrowLeft,
} from "lucide-react";
import {
    Button, IconButton, Input, Select, Card, CardHeader, CardBody, Badge,
    Modal, ConfirmDialog, EmptyState, Tabs, useToast, cn,
} from "./ui";

const GROQ_API_KEY = "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";

const CATEGORIES = ["YouTube", "Podcast", "Reel", "Speech", "Story", "Ad", "Other"];
const TONES = ["Motivational", "Casual", "Professional", "Humorous", "Dramatic", "Educational"];
const QUICK_ACTIONS = [
    { label: "Add Hook", prompt: "Write a powerful attention-grabbing hook for this script. Return only the hook text." },
    { label: "Add CTA", prompt: "Write a compelling call-to-action ending for this script. Return only the CTA text." },
    { label: "Improve Flow", prompt: "Rewrite this script with better flow and transitions. Keep the same content but make it smoother." },
    { label: "Make Shorter", prompt: "Condense this script to 60% of its length while keeping all key points." },
    { label: "Make Longer", prompt: "Expand this script with more detail, examples, and depth. Keep the same tone." },
    { label: "Fix Grammar", prompt: "Fix all grammar, punctuation, and spelling errors in this script. Return the corrected script only." },
];

async function callGroq(messages) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, temperature: 0.8, max_tokens: 2048 }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.choices[0].message.content;
}

function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readTime(text) {
    const wpm = 150;
    const mins = Math.ceil(wordCount(text) / wpm);
    return mins < 1 ? "<1 min" : `~${mins} min`;
}

// Custom hook for responsive breakpoints
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isMobile;
}

export default function ScriptWriter() {
    const toast = useToast();
    const [scripts, setScripts] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("YouTube");
    const [tone, setTone] = useState("Motivational");
    const [tags, setTags] = useState("");
    const [search, setSearch] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [preview, setPreview] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [aiPanel, setAiPanel] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const textareaRef = useRef(null);
    const historyRef = useRef([]);
    const isMobile = useIsMobile();

    // Mobile view state: "list" | "editor" | "ai"
    const [mobileView, setMobileView] = useState("list");
    // Mobile bottom sheet for AI panel
    const [aiSheetOpen, setAiSheetOpen] = useState(false);

    useEffect(() => { loadScripts(); }, []);

    async function loadScripts() {
        const { data } = await supabase.from("scripts").select("*").order("updated_at", { ascending: false });
        setScripts(data || []);
    }

    function pushHistory(val) {
        const newH = [...historyRef.current.slice(0, historyIdx + 1), val].slice(-50);
        historyRef.current = newH;
        setHistory(newH);
        setHistoryIdx(newH.length - 1);
    }

    function handleContentChange(val) {
        setContent(val);
        pushHistory(val);
    }

    function undo() {
        if (historyIdx > 0) {
            const idx = historyIdx - 1;
            setHistoryIdx(idx);
            setContent(historyRef.current[idx]);
        }
    }

    function openScript(s) {
        setActiveId(s.id);
        setTitle(s.title);
        setContent(s.content);
        setCategory(s.category || "YouTube");
        setTone(s.tone || "Motivational");
        setTags(s.tags || "");
        historyRef.current = [s.content];
        setHistory([s.content]);
        setHistoryIdx(0);
        if (isMobile) setMobileView("editor");
    }

    function newScript() {
        setActiveId(null);
        setTitle("");
        setContent("");
        setCategory("YouTube");
        setTone("Motivational");
        setTags("");
        historyRef.current = [""];
        setHistory([""]);
        setHistoryIdx(0);
        if (isMobile) setMobileView("editor");
    }

    async function saveScript() {
        if (!title.trim()) { toast.error("Please enter a title first."); return; }
        setSaving(true);
        const payload = { title, content, category, tone, tags, updated_at: new Date().toISOString() };
        try {
            if (activeId) {
                const { error } = await supabase.from("scripts").update(payload).eq("id", activeId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from("scripts").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
                if (error) throw error;
                if (data) setActiveId(data.id);
            }
            await loadScripts();
            toast.success("Script saved.");
        } catch (err) {
            toast.error("Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteScript(id) {
        await supabase.from("scripts").delete().eq("id", id);
        if (activeId === id) newScript();
        await loadScripts();
    }

    async function confirmDeleteScript() {
        if (!deleteTarget) return;
        await deleteScript(deleteTarget.id);
        setDeleteTarget(null);
    }

    async function generateWithAI(customPrompt) {
        const prompt = customPrompt || aiPrompt;
        if (!prompt.trim()) return;
        setAiLoading(true);
        try {
            const systemMsg = `You are a professional script writer. Write scripts that are engaging, well-structured, and ready to use. Tone: ${tone}. Category: ${category}.`;
            let userMsg;
            if (content.trim() && !customPrompt) {
                userMsg = `Current script:\n${content}\n\nInstruction: ${prompt}`;
            } else if (content.trim() && customPrompt) {
                userMsg = `Current script:\n${content}\n\n${prompt}`;
            } else {
                userMsg = `Write a ${tone.toLowerCase()} ${category} script about: ${prompt}`;
            }
            const result = await callGroq([{ role: "system", content: systemMsg }, { role: "user", content: userMsg }]);
            handleContentChange(result);
            if (!customPrompt) setAiPrompt("");
            if (isMobile) setAiSheetOpen(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAiLoading(false);
        }
    }

    function insertFormat(prefix, suffix = "") {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
        handleContentChange(newContent);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
    }

    function copyContent() {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function downloadScript() {
        const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${title || "script"}.txt`; a.click();
        URL.revokeObjectURL(url);
    }

    const filtered = scripts.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.tags || "").toLowerCase().includes(search.toLowerCase())
    );

    function renderAiTools() {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Generate / Edit</p>
                    <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Describe what to write or how to edit the current script..."
                        rows={3}
                        className="w-full text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none p-3 rounded-lg resize-none border border-[var(--border)] bg-[var(--surface)] transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <Button
                        variant="primary"
                        className="w-full mt-2"
                        icon={<Sparkles size={15} />}
                        loading={aiLoading}
                        disabled={aiLoading || !aiPrompt.trim()}
                        onClick={() => generateWithAI()}
                    >
                        {content.trim() ? "Edit with AI" : "Generate Script"}
                    </Button>
                </div>

                <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map(({ label, prompt }) => (
                            <button
                                key={label}
                                onClick={() => generateWithAI(prompt)}
                                disabled={aiLoading || !content.trim()}
                                className="text-left px-3 py-2.5 rounded-lg text-xs text-[var(--text)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeId && (
                    <div className="rounded-lg p-3 bg-[var(--surface-hover)] border border-[var(--border)] flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Script Info</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                            <span className="text-[var(--text-muted)]">Category</span><span className="text-[var(--text)] text-right">{category}</span>
                            <span className="text-[var(--text-muted)]">Tone</span><span className="text-[var(--text)] text-right">{tone}</span>
                            <span className="text-[var(--text-muted)]">Words</span><span className="text-[var(--text)] text-right">{wordCount(content)}</span>
                            <span className="text-[var(--text-muted)]">Read time</span><span className="text-[var(--text)] text-right">{readTime(content)}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text)]">Script Writer</h1>
                        <p className="text-sm text-[var(--text-muted)]">Draft, edit, and polish scripts with AI assistance.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isMobile && (
                        <Button variant="secondary" size="sm" icon={<List size={14} />} onClick={() => setSidebarOpen(v => !v)}>
                            {sidebarOpen ? "Hide List" : "Show List"}
                        </Button>
                    )}
                    <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={newScript}>New Script</Button>
                </div>
            </div>

            {/* Mobile list/editor switcher */}
            {isMobile && (
                <Tabs
                    tabs={[{ value: "list", label: "My Scripts" }, { value: "editor", label: "Editor" }]}
                    value={mobileView}
                    onChange={setMobileView}
                />
            )}

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Scripts list panel */}
                <AnimatePresence>
                    {(isMobile ? mobileView === "list" : sidebarOpen) && (
                        <motion.div
                            key="list-panel"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.15 }}
                            className="w-full lg:w-72 shrink-0"
                        >
                            <Card>
                                <CardHeader
                                    icon={<FileText size={16} />}
                                    title="Scripts"
                                    action={
                                        <IconButton label="New script" onClick={newScript}>
                                            <Plus size={15} />
                                        </IconButton>
                                    }
                                />
                                <CardBody className="flex flex-col gap-3">
                                    <Input leadingIcon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search scripts..." />
                                    <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto -mx-1 px-1">
                                        {filtered.length === 0 ? (
                                            <EmptyState
                                                icon={<FileText size={20} />}
                                                title="No scripts yet"
                                                message="Create your first script to get started."
                                                action={<Button size="sm" icon={<Plus size={14} />} onClick={newScript}>New Script</Button>}
                                            />
                                        ) : filtered.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => openScript(s)}
                                                className={cn(
                                                    "group flex items-start gap-2 p-3 rounded-lg cursor-pointer border transition-colors",
                                                    activeId === s.id ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-[var(--surface-hover)]"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text)] truncate">{s.title}</p>
                                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                        <Badge variant="neutral">{s.category}</Badge>
                                                        <span className="text-xs text-[var(--text-muted)]">{new Date(s.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {s.tags && <p className="text-xs text-primary mt-1 truncate">{s.tags}</p>}
                                                </div>
                                                <IconButton
                                                    variant="danger"
                                                    size="sm"
                                                    label="Delete"
                                                    onClick={e => { e.stopPropagation(); setDeleteTarget(s); }}
                                                    className={cn("shrink-0", !isMobile && "opacity-0 group-hover:opacity-100")}
                                                >
                                                    <Trash2 size={13} />
                                                </IconButton>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Editor panel */}
                <AnimatePresence>
                    {(isMobile ? mobileView === "editor" : true) && (
                        <motion.div
                            key="editor-panel"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 w-full min-w-0"
                        >
                            <Card>
                                <CardBody className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {isMobile && (
                                            <IconButton label="Back to scripts" onClick={() => setMobileView("list")}>
                                                <ArrowLeft size={16} />
                                            </IconButton>
                                        )}
                                        <div className="flex-1 min-w-[160px]">
                                            <Input
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder="Enter script title..."
                                                className={!title.trim() ? "!border-danger" : ""}
                                            />
                                        </div>
                                        <div className="w-36 shrink-0">
                                            <Select value={category} onChange={e => setCategory(e.target.value)}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                        </div>
                                        <div className="w-36 shrink-0">
                                            <Select value={tone} onChange={e => setTone(e.target.value)}>
                                                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-wrap border-y border-[var(--border)] py-2">
                                        <IconButton size="sm" label="Bold" onClick={() => insertFormat("**", "**")}><Bold size={14} /></IconButton>
                                        <IconButton size="sm" label="Italic" onClick={() => insertFormat("_", "_")}><Italic size={14} /></IconButton>
                                        <IconButton size="sm" label="Heading" onClick={() => insertFormat("\n# ")}><Hash size={14} /></IconButton>
                                        <IconButton size="sm" label="List" onClick={() => insertFormat("\n- ")}><AlignLeft size={14} /></IconButton>
                                        <span className="w-px h-5 bg-[var(--border)] mx-1" />
                                        <IconButton size="sm" label="Undo" onClick={undo} disabled={historyIdx <= 0}><RotateCcw size={14} /></IconButton>
                                        <IconButton size="sm" label={preview ? "Edit" : "Preview"} onClick={() => setPreview(v => !v)}>
                                            {preview ? <EyeOff size={14} className="text-primary" /> : <Eye size={14} />}
                                        </IconButton>
                                        <IconButton size="sm" label="Copy" onClick={copyContent}>
                                            {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                                        </IconButton>
                                        <IconButton size="sm" label="Download" onClick={downloadScript}><Download size={14} /></IconButton>
                                        <Button size="sm" className="ml-auto" icon={<Save size={14} />} loading={saving} disabled={!title.trim()} onClick={saveScript}>
                                            Save
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Tag size={14} className="text-[var(--text-muted)] shrink-0" />
                                        <input
                                            value={tags}
                                            onChange={e => setTags(e.target.value)}
                                            placeholder="Tags (comma separated)..."
                                            className="flex-1 min-w-[120px] bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                                        />
                                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0">
                                            <span className="inline-flex items-center gap-1"><Clock size={11} />{readTime(content)}</span>
                                            <span>{wordCount(content)} words</span>
                                            <span>{content.length} chars</span>
                                        </div>
                                    </div>

                                    {preview ? (
                                        <div className="prose prose-sm max-w-none">
                                            <h2 className="text-lg font-bold text-[var(--text)] mb-3">{title || "Untitled"}</h2>
                                            <div className="text-[var(--text)] leading-8 whitespace-pre-wrap" style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>
                                                {content || <span className="text-[var(--text-muted)]">Nothing to preview yet.</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <textarea
                                            ref={textareaRef}
                                            value={content}
                                            onChange={e => handleContentChange(e.target.value)}
                                            placeholder="Start writing your script here, or use AI to generate one..."
                                            className="w-full min-h-[360px] resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] leading-8 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-[var(--text-muted)]"
                                            style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
                                        />
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI panel (desktop persistent column) */}
                {!isMobile && (
                    <AnimatePresence>
                        {aiPanel && (
                            <motion.div
                                key="ai-panel"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.15 }}
                                className="w-full lg:w-80 shrink-0"
                            >
                                <Card>
                                    <CardHeader
                                        icon={<Wand2 size={16} />}
                                        title="AI Writer"
                                        action={
                                            <IconButton label="Close" onClick={() => setAiPanel(false)}>
                                                <X size={14} />
                                            </IconButton>
                                        }
                                    />
                                    <CardBody>{renderAiTools()}</CardBody>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Floating AI trigger (mobile) */}
            {isMobile && (
                <button
                    onClick={() => setAiSheetOpen(true)}
                    className="fixed bottom-5 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[var(--shadow-lg)] z-30 bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                    <Wand2 size={20} />
                </button>
            )}

            {/* Floating AI re-open trigger (desktop, when panel closed) */}
            {!isMobile && !aiPanel && (
                <button
                    onClick={() => setAiPanel(true)}
                    className="fixed right-6 bottom-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-[var(--shadow-lg)] z-50 bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                    <Wand2 size={18} />
                </button>
            )}

            {/* Mobile AI sheet */}
            <Modal open={isMobile && aiSheetOpen} onClose={() => setAiSheetOpen(false)} title="AI Writer" size="md">
                {renderAiTools()}
            </Modal>

            {/* Delete confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteScript}
                title="Delete script?"
                message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
            />
        </div>
    );
}
