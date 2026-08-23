import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Upload, X, Loader2, Trash2, ZoomIn, Pencil, Check, MoreVertical, Download, Heart, Video } from "lucide-react";
import Navbar from "./NavBar";
import { supabase } from "../supabase";

const CLOUD_NAME = "dk8wc11kq";
const UPLOAD_PRESET = "Self-Development";

const TABS = [
    { key: "gallery",  label: "Gallery",   Icon: Images, accent: "cyan",  color: "rgba(34,211,238,", border: "border-cyan-500/30",  text: "text-cyan-400",  bg: "bg-cyan-500/20",  hbg: "hover:bg-cyan-500/30",  table: "gallery" },
    { key: "memories", label: "Memories",  Icon: Heart,  accent: "rose",  color: "rgba(251,113,133,", border: "border-rose-500/30",  text: "text-rose-400",  bg: "bg-rose-500/20",  hbg: "hover:bg-rose-500/30",  table: "memories" },
];

function GalleryTab({ tab }) {
    const [images, setImages]     = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
    const [files, setFiles]       = useState([]); // [{ file, localUrl, caption, isVideo }]
    const [lightbox, setLightbox] = useState(null);
    const [editing, setEditing]   = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);
    const fileRef = useRef();

    useEffect(() => { fetchImages(); }, [tab.key]);

    useEffect(() => {
        const close = () => setMenuOpen(null);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    async function fetchImages() {
        const { data } = await supabase.from(tab.table).select("*").order("created_at", { ascending: false });
        if (data) setImages(data);
    }

    function onFileChange(e) {
        const selected = Array.from(e.target.files);
        if (!selected.length) return;
        const newFiles = selected.map(file => ({
            file,
            localUrl: URL.createObjectURL(file),
            caption: "",
            isVideo: file.type.startsWith("video/"),
        }));
        setFiles(prev => [...prev, ...newFiles]);
        fileRef.current.value = "";
    }

    function removeFile(idx) {
        setFiles(prev => { URL.revokeObjectURL(prev[idx].localUrl); return prev.filter((_, i) => i !== idx); });
    }

    function updateCaption(idx, value) {
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, caption: value } : f));
    }

    async function handleUpload() {
        if (!files.length) return;
        setUploading(true);
        setUploadProgress({ done: 0, total: files.length });
        try {
            const rows = await Promise.all(files.map(async ({ file, caption, isVideo }) => {
                const form = new FormData();
                form.append("file", file);
                form.append("upload_preset", UPLOAD_PRESET);
                const endpoint = isVideo
                    ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
                    : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
                const res = await fetch(endpoint, { method: "POST", body: form });
                const data = await res.json();
                if (!data.secure_url) throw new Error("Upload failed for " + file.name);
                setUploadProgress(p => ({ ...p, done: p.done + 1 }));
                return { url: data.secure_url, caption: caption.trim() || null, type: isVideo ? "video" : "image" };
            }));
            await supabase.from(tab.table).insert(rows);
            files.forEach(f => URL.revokeObjectURL(f.localUrl));
            setFiles([]);
            fetchImages();
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            setUploadProgress({ done: 0, total: 0 });
        }
    }

    async function handleDelete(id) {
        await supabase.from(tab.table).delete().eq("id", id);
        setImages(prev => prev.filter(img => img.id !== id));
        if (lightbox?.id === id) setLightbox(null);
    }

    async function handleEditSave() {
        if (!editing) return;
        await supabase.from(tab.table).update({ caption: editing.caption.trim() || null }).eq("id", editing.id);
        setImages(prev => prev.map(img => img.id === editing.id ? { ...img, caption: editing.caption.trim() || null } : img));
        setEditing(null);
    }

    async function handleDownload(url, cap) {
        const res = await fetch(url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = cap || "image";
        a.click();
        URL.revokeObjectURL(a.href);
    }

    const { Icon, text, bg, hbg, border, color } = tab;

    return (
        <>
            {/* Upload Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="dash-glass rounded-3xl p-4 sm:p-8 mb-8 sm:mb-12 max-w-2xl mx-auto">
                <h2 className={`text-lg font-bold text-[#3D52A0] mb-6 flex items-center gap-2`}>
                    <Upload size={18} className={text} /> Upload {tab.label === "Memories" ? "Memories" : "Images"}
                </h2>

                {/* Drop zone */}
                <div
                    onClick={() => fileRef.current.click()}
                    className={`border-2 border-dashed border-slate-700 rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-colors mb-4`}
                    style={{ borderColor: files.length ? `${color}0.4)` : undefined }}
                >
                    <div className="text-slate-500">
                        <Upload size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Click to select images or videos</p>
                        <p className="text-xs opacity-50 mt-1">Multiple files supported</p>
                    </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFileChange} />

                {/* Selected files previews */}
                {files.length > 0 && (
                    <div className="space-y-3 mb-4">
                        {files.map((f, idx) => (
                            <div key={idx} className="flex gap-3 items-center bg-slate-900/50 rounded-xl p-2 border border-white/5">
                                <div className="relative flex-shrink-0">
                                    {f.isVideo ? (
                                        <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Video size={24} className={text} />
                                        </div>
                                    ) : (
                                        <img src={f.localUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 truncate mb-1.5">{f.file.name}</p>
                                    <input
                                        type="text"
                                        placeholder="Caption (optional)"
                                        value={f.caption}
                                        onChange={e => updateCaption(idx, e.target.value)}
                                        className="w-full bg-slate-800/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
                                    />
                                </div>
                                <button onClick={() => removeFile(idx)} className="flex-shrink-0 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all">
                                    <X size={14} className="text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleUpload}
                        disabled={!files.length || uploading}
                        className={`flex-1 flex items-center justify-center gap-2 ${bg} ${hbg} border ${border} ${text} font-bold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading
                            ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                            : files.length > 1 ? `Upload ${files.length} files` : "Upload"}
                    </button>
                    {files.length > 0 && !uploading && (
                        <button
                            onClick={() => { files.forEach(f => URL.revokeObjectURL(f.localUrl)); setFiles([]); }}
                            className="px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Grid */}
            {images.length === 0 ? (
                <div className="text-center text-slate-600 py-20">
                    <Icon size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-mono text-sm">No media yet. Upload your first one.</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {images.map((img, i) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="gallery-card dash-glass rounded-2xl overflow-hidden break-inside-avoid group relative"
                        >
                            {img.type === "video" ? (
                                <video
                                    src={img.url}
                                    className="w-full object-cover cursor-pointer"
                                    onClick={() => setLightbox(img)}
                                    muted playsInline
                                    onMouseEnter={e => e.target.play()}
                                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                />
                            ) : (
                                <img
                                    src={img.url}
                                    alt={img.caption || "image"}
                                    className="w-full object-cover cursor-pointer"
                                    onClick={() => setLightbox(img)}
                                />
                            )}
                            {/* Mobile 3-dot */}
                            <button
                                onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === img.id ? null : img.id); }}
                                className="absolute top-2 right-2 z-20 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-sm lg:hidden"
                            >
                                <MoreVertical size={15} className="text-[#3D52A0]" />
                            </button>
                            {menuOpen === img.id && (
                                <div onClick={e => e.stopPropagation()} className="absolute top-9 right-2 z-30 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-xl lg:hidden">
                                    <button onClick={() => { setLightbox(img); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 transition-all"><ZoomIn size={13} /> View</button>
                                    <button onClick={() => { setEditing({ id: img.id, caption: img.caption || "" }); setMenuOpen(null); }} className={`flex items-center gap-2 w-full px-4 py-2.5 text-xs ${text} hover:bg-white/10 transition-all`}><Pencil size={13} /> Edit Caption</button>
                                    <button onClick={() => { handleDownload(img.url, img.caption); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-all"><Download size={13} /> Download</button>
                                    <button onClick={() => { handleDelete(img.id); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /> Delete</button>
                                </div>
                            )}
                            {/* Desktop hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all items-center justify-center gap-3 hidden lg:flex opacity-0 group-hover:opacity-100">
                                <button onClick={() => setLightbox(img)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all"><ZoomIn size={16} className="text-[#3D52A0]" /></button>
                                <button onClick={() => setEditing({ id: img.id, caption: img.caption || "" })} className={`p-2 ${bg} ${hbg} rounded-xl backdrop-blur-sm transition-all`}><Pencil size={16} className={text} /></button>
                                <button onClick={() => handleDownload(img.url, img.caption)} className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-xl backdrop-blur-sm transition-all"><Download size={16} className="text-emerald-400" /></button>
                                <button onClick={() => handleDelete(img.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl backdrop-blur-sm transition-all"><Trash2 size={16} className="text-red-400" /></button>
                            </div>
                            {editing?.id === img.id ? (
                                <div className="px-4 py-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        value={editing.caption}
                                        onChange={e => setEditing(prev => ({ ...prev, caption: e.target.value }))}
                                        onKeyDown={e => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditing(null); }}
                                        className={`flex-1 bg-slate-900/80 border ${border} rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none`}
                                    />
                                    <button onClick={handleEditSave} className={`p-1.5 ${bg} ${hbg} rounded-lg transition-all`}><Check size={14} className={text} /></button>
                                    <button onClick={() => setEditing(null)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"><X size={14} className="text-slate-400" /></button>
                                </div>
                            ) : img.caption ? (
                                <div className="px-4 py-3">
                                    <p className="text-slate-400 text-xs font-medium">{img.caption}</p>
                                </div>
                            ) : null}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setLightbox(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-4xl max-h-[90vh] px-6"
                        >
                            {lightbox.type === "video" ? (
                                <video src={lightbox.url} className="max-h-[80vh] w-full rounded-2xl object-contain" controls autoPlay />
                            ) : (
                                <img src={lightbox.url} alt={lightbox.caption || ""} className="max-h-[80vh] w-full rounded-2xl object-contain" />
                            )}
                            {lightbox.caption && <p className="text-center text-slate-400 text-sm mt-3">{lightbox.caption}</p>}
                            <button onClick={() => setLightbox(null)} className="absolute top-2 right-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/10 transition-all"><X size={16} className="text-[#3D52A0]" /></button>
                            <button onClick={() => handleDownload(lightbox.url, lightbox.caption)} className="absolute top-2 left-0 p-2 bg-emerald-900/80 hover:bg-emerald-800 rounded-full border border-emerald-500/20 transition-all"><Download size={16} className="text-emerald-400" /></button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default function GalleryPage() {
    const [activeTab, setActiveTab] = useState("gallery");
    const tab = TABS.find(t => t.key === activeTab);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`
                .dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
                .gallery-card { transition: all 0.3s ease; }
                .gallery-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,229,255,0.08); }
            `}</style>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className={`inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 ${tab.text} ${tab.border} shadow-[0_0_20px_rgba(34,211,238,0.2)]`}>
                        <tab.Icon size={32} />
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-4 tracking-tight">
                        MY {tab.label.toUpperCase()}
                    </h1>
                    <p className={`${tab.text} font-mono text-sm tracking-[0.3em] uppercase opacity-60`}>
                        {tab.key === "gallery" ? "Memories • Moments • Milestones" : "Cherished • Captured • Forever"}
                    </p>
                </motion.div>

                {/* Sub-tab switcher */}
                <div className="flex gap-2 mb-10 dash-glass p-1 rounded-xl w-fit mx-auto">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all flex items-center gap-2 ${
                                activeTab === t.key
                                    ? `bg-gradient-to-r ${t.key === "gallery" ? "from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/30" : "from-rose-500/30 to-pink-500/30 text-rose-300 border border-rose-500/30"}`
                                    : "text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            <t.Icon size={13} /> {t.label}
                        </button>
                    ))}
                </div>

                <GalleryTab key={activeTab} tab={tab} />
            </div>
        </motion.div>
    );
}
