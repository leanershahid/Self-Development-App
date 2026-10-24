import React, { useRef, useState, useEffect } from "react";
import { Upload, Loader2, X, ImagePlus, FileText, Camera } from "lucide-react";

const CLOUD_NAME = "dk8wc11kq";
const UPLOAD_PRESET = "Self-Development";

export default function CloudinaryUpload({ onUpload, currentUrl, label = "Upload Image", className = "", showPreview = true, acceptPdf = false, variant = "default" }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentUrl || null);
    const fileRef = useRef();

    useEffect(() => {
        setPreview(currentUrl || null);
    }, [currentUrl]);

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("upload_preset", UPLOAD_PRESET);
            const isPdf = file.type === 'application/pdf';
            const endpoint = isPdf
                ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
                : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const res = await fetch(endpoint, { method: "POST", body: form });
            const data = await res.json();
            if (!data.secure_url) throw new Error("Upload failed");
            setPreview(data.secure_url);
            onUpload(data.secure_url, file.name);
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            fileRef.current.value = "";
        }
    }

    function clear(e) {
        e.stopPropagation();
        setPreview(null);
        onUpload("");
    }

    const fileInput = (
        <input ref={fileRef} type="file" accept={acceptPdf ? ".pdf,image/*" : "image/*"} className="hidden" onChange={handleFile} />
    );

    if (variant === "avatar") {
        return (
            <div className={`relative inline-flex ${className}`}>
                {fileInput}
                <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    disabled={uploading}
                    title={label}
                    aria-label={label}
                    className="w-8 h-8 rounded-full bg-primary text-white border-2 border-[var(--surface)] shadow-[var(--shadow-sm)] flex items-center justify-center hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {fileInput}

            {showPreview && preview && !acceptPdf ? (
                <div className="relative group w-full">
                    <img src={preview} alt="uploaded" className="w-full h-32 object-cover rounded-xl border border-[var(--border)]" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <button type="button" onClick={() => fileRef.current.click()}
                            className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-white hover:bg-primary/30 transition-all">
                            <Upload size={14} />
                        </button>
                        <button type="button" onClick={clear}
                            className="p-2 rounded-lg bg-danger/20 border border-danger/40 text-white hover:bg-danger/30 transition-all">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : preview && acceptPdf ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-accent/30 bg-accent/5">
                    <FileText size={20} className="text-accent shrink-0" />
                    <span className="text-sm text-accent flex-1 truncate">Resume uploaded</span>
                    <button type="button" onClick={clear} className="text-[var(--text-muted)] hover:text-danger transition-colors"><X size={14} /></button>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--field-border)] hover:border-primary/50 text-[var(--text-muted)] hover:text-primary bg-[var(--surface-hover)] transition-all text-sm disabled:opacity-50">
                    {uploading
                        ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                        : acceptPdf
                            ? <><FileText size={16} /> {label}</>
                            : <><ImagePlus size={16} /> {label}</>
                    }
                </button>
            )}
        </div>
    );
}
