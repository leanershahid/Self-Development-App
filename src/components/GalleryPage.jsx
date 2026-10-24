import React, { useState, useEffect, useRef } from "react";
import { Images, Upload, X, Trash2, ZoomIn, Pencil, Check, MoreVertical, Download, Heart, Video } from "lucide-react";
import { supabase } from "../supabase";
import { Card, CardHeader, CardBody, Badge, Button, IconButton, Tabs, EmptyState, SkeletonCard, Modal, useToast } from "./ui";

const CLOUD_NAME = "dk8wc11kq";
const UPLOAD_PRESET = "Self-Development";

const TABS = [
    { key: "gallery",  label: "Gallery",   Icon: Images, table: "gallery" },
    { key: "memories", label: "Memories",  Icon: Heart,  table: "memories" },
];

function GalleryTab({ tab }) {
    const toast = useToast();
    const [images, setImages]     = useState([]);
    const [loading, setLoading]   = useState(true);
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
        setLoading(true);
        const { data } = await supabase.from(tab.table).select("*").order("created_at", { ascending: false });
        if (data) setImages(data);
        setLoading(false);
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
            toast.success(rows.length > 1 ? `Uploaded ${rows.length} files` : "Uploaded");
            fetchImages();
        } catch (err) {
            toast.error("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            setUploadProgress({ done: 0, total: 0 });
        }
    }

    async function handleDelete(id) {
        await supabase.from(tab.table).delete().eq("id", id);
        setImages(prev => prev.filter(img => img.id !== id));
        if (lightbox?.id === id) setLightbox(null);
        toast.success("Deleted");
    }

    async function handleEditSave() {
        if (!editing) return;
        await supabase.from(tab.table).update({ caption: editing.caption.trim() || null }).eq("id", editing.id);
        setImages(prev => prev.map(img => img.id === editing.id ? { ...img, caption: editing.caption.trim() || null } : img));
        setEditing(null);
        toast.success("Caption updated");
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

    const { Icon } = tab;

    return (
        <>
            {/* Upload Card */}
            <Card>
                <CardHeader
                    icon={<Upload size={18} />}
                    title={`Upload ${tab.label}`}
                    subtitle="Images and videos — multiple files supported"
                />
                <CardBody className="flex flex-col gap-4">
                    {/* Drop zone */}
                    <div
                        onClick={() => fileRef.current.click()}
                        className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                        <Upload size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text)]">Click to select images or videos</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Multiple files supported</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFileChange} />

                    {/* Selected files previews */}
                    {files.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {files.map((f, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-[var(--surface-hover)] rounded-lg p-2 border border-[var(--border)]">
                                    <div className="relative flex-shrink-0">
                                        {f.isVideo ? (
                                            <div className="w-14 h-14 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)]">
                                                <Video size={22} />
                                            </div>
                                        ) : (
                                            <img src={f.localUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[var(--text-muted)] truncate mb-1.5">{f.file.name}</p>
                                        <input
                                            type="text"
                                            placeholder="Caption (optional)"
                                            value={f.caption}
                                            onChange={e => updateCaption(idx, e.target.value)}
                                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-primary/40"
                                        />
                                    </div>
                                    <IconButton variant="danger" label="Remove file" onClick={() => removeFile(idx)}>
                                        <X size={14} />
                                    </IconButton>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            className="flex-1"
                            disabled={!files.length || uploading}
                            loading={uploading}
                            icon={!uploading ? <Upload size={16} /> : null}
                            onClick={handleUpload}
                        >
                            {uploading
                                ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                                : files.length > 1 ? `Upload ${files.length} files` : "Upload"}
                        </Button>
                        {files.length > 0 && !uploading && (
                            <IconButton
                                label="Clear selection"
                                onClick={() => { files.forEach(f => URL.revokeObjectURL(f.localUrl)); setFiles([]); }}
                            >
                                <X size={16} />
                            </IconButton>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : images.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Icon size={20} />}
                        title="No media yet"
                        message={`Upload your first ${tab.key === "gallery" ? "image" : "memory"} to get started.`}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id}>
                            <Card className="overflow-hidden group relative">
                                {img.type === "video" ? (
                                    <video
                                        src={img.url}
                                        className="w-full h-36 sm:h-40 object-cover cursor-pointer"
                                        onClick={() => setLightbox(img)}
                                        muted playsInline
                                        onMouseEnter={e => e.target.play()}
                                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                    />
                                ) : (
                                    <img
                                        src={img.url}
                                        alt={img.caption || "image"}
                                        className="w-full h-36 sm:h-40 object-cover cursor-pointer"
                                        onClick={() => setLightbox(img)}
                                    />
                                )}

                                {img.type === "video" && (
                                    <div className="absolute top-2 left-2 rounded-full bg-black/45 backdrop-blur-sm">
                                        <Badge variant="info">
                                            <Video size={10} /> Video
                                        </Badge>
                                    </div>
                                )}

                                {/* Mobile 3-dot */}
                                <button
                                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === img.id ? null : img.id); }}
                                    className="absolute top-2 right-2 z-20 p-1.5 bg-black/55 hover:bg-black/75 rounded-lg backdrop-blur-sm text-white lg:hidden"
                                >
                                    <MoreVertical size={15} />
                                </button>
                                {menuOpen === img.id && (
                                    <div onClick={e => e.stopPropagation()} className="absolute top-9 right-2 z-30 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-lg)] lg:hidden">
                                        <button onClick={() => { setLightbox(img); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"><ZoomIn size={13} /> View</button>
                                        <button onClick={() => { setEditing({ id: img.id, caption: img.caption || "" }); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-primary hover:bg-[var(--surface-hover)] transition-all"><Pencil size={13} /> Edit Caption</button>
                                        <button onClick={() => { handleDownload(img.url, img.caption); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-accent hover:bg-accent/10 transition-all"><Download size={13} /> Download</button>
                                        <button onClick={() => { handleDelete(img.id); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-danger hover:bg-danger/10 transition-all"><Trash2 size={13} /> Delete</button>
                                    </div>
                                )}

                                {/* Desktop hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all items-center justify-center gap-2 hidden lg:flex opacity-0 group-hover:opacity-100">
                                    <button onClick={() => setLightbox(img)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm text-white transition-all"><ZoomIn size={16} /></button>
                                    <button onClick={() => setEditing({ id: img.id, caption: img.caption || "" })} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm text-white transition-all"><Pencil size={16} /></button>
                                    <button onClick={() => handleDownload(img.url, img.caption)} className="p-2 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-lg backdrop-blur-sm text-white transition-all"><Download size={16} /></button>
                                    <button onClick={() => handleDelete(img.id)} className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg backdrop-blur-sm text-white transition-all"><Trash2 size={16} /></button>
                                </div>

                                {editing?.id === img.id ? (
                                    <div className="px-3 py-2.5 flex gap-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            value={editing.caption}
                                            onChange={e => setEditing(prev => ({ ...prev, caption: e.target.value }))}
                                            onKeyDown={e => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditing(null); }}
                                            className="flex-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-primary/40"
                                        />
                                        <IconButton variant="accent" label="Save caption" onClick={handleEditSave}><Check size={14} /></IconButton>
                                        <IconButton label="Cancel" onClick={() => setEditing(null)}><X size={14} /></IconButton>
                                    </div>
                                ) : img.caption ? (
                                    <div className="px-3 py-2.5">
                                        <p className="text-[var(--text-muted)] text-xs font-medium truncate">{img.caption}</p>
                                    </div>
                                ) : null}
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <Modal
                open={!!lightbox}
                onClose={() => setLightbox(null)}
                title={lightbox?.caption || (lightbox?.type === "video" ? "Video" : "Image")}
                size="xl"
                footer={lightbox && (
                    <Button variant="secondary" icon={<Download size={16} />} onClick={() => handleDownload(lightbox.url, lightbox.caption)}>
                        Download
                    </Button>
                )}
            >
                {lightbox && (
                    lightbox.type === "video" ? (
                        <video src={lightbox.url} className="w-full max-h-[70vh] rounded-lg object-contain bg-black" controls autoPlay />
                    ) : (
                        <img src={lightbox.url} alt={lightbox.caption || ""} className="w-full max-h-[70vh] rounded-lg object-contain" />
                    )
                )}
            </Modal>
        </>
    );
}

export default function GalleryPage() {
    const [activeTab, setActiveTab] = useState("gallery");
    const tab = TABS.find(t => t.key === activeTab);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
                    <tab.Icon size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)]">{tab.label}</h1>
                <p className="text-sm text-[var(--text-muted)]">
                    {tab.key === "gallery" ? "Memories, moments, and milestones." : "Cherished memories, captured forever."}
                </p>
            </div>

            {/* Sub-tab switcher */}
            <Tabs
                tabs={TABS.map(t => ({ value: t.key, label: t.label }))}
                value={activeTab}
                onChange={setActiveTab}
                className="justify-center"
            />

            <GalleryTab key={activeTab} tab={tab} />
        </div>
    );
}
