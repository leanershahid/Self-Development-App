import { useEffect, useState } from "react";
import { X, Briefcase, Star, Flame, Trophy, Calendar } from "lucide-react";

const START_DAY = 271;
const JOIN_DATE = (() => {
    // Calculate join date by going back START_DAY-1 days from today's reference
    // We fix the join date so day count always increments correctly
    // Day 271 was completed, so join date = today - 271 days (at time of setup)
    // We store the join date in localStorage on first run
    const stored = localStorage.getItem("m2h_join_date");
    if (stored) return new Date(stored);
    // First time: set join date so that today = day 271
    const d = new Date();
    d.setDate(d.getDate() - 271);
    d.setHours(0, 0, 0, 0);
    localStorage.setItem("m2h_join_date", d.toISOString());
    return d;
})();

function getDayCount() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - JOIN_DATE) / (1000 * 60 * 60 * 24));
    return diff + 1; // day 1 = join date
}

function getMilestone(day) {
    if (day >= 365) return { label: "1 Year Legend 🏆", color: "#fbbf24" };
    if (day >= 300) return { label: "300 Days Warrior ⚔️", color: "#a78bfa" };
    if (day >= 271) return { label: "9 Months Strong 💪", color: "#22d3ee" };
    if (day >= 180) return { label: "Half Year Hero 🌟", color: "#4ade80" };
    if (day >= 100) return { label: "Century Club 🎯", color: "#f97316" };
    return { label: "Keep Going 🔥", color: "#f43f5e" };
}

function getRemainingTo365(day) {
    return Math.max(0, 365 - day);
}

export default function M2HCountdownModal() {
    const [visible, setVisible] = useState(false);
    const [day, setDay] = useState(getDayCount());

    useEffect(() => {
        const today = new Date().toDateString();
        const lastSeen = localStorage.getItem("m2h_modal_last_seen");
        if (lastSeen !== today) {
            setDay(getDayCount());
            setVisible(true);
        }
    }, []);

    function close() {
        localStorage.setItem("m2h_modal_last_seen", new Date().toDateString());
        setVisible(false);
    }

    if (!visible) return null;

    const milestone = getMilestone(day);
    const remaining = getRemainingTo365(day);
    const progress = Math.min((day / 365) * 100, 100);
    const years = Math.floor(day / 365);
    const months = Math.floor((day % 365) / 30);
    const days = day % 30;

    return (
        <div
            onClick={close}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "16px",
                animation: "m2hFadeIn 0.3s ease both",
            }}
        >
            <style>{`
                @keyframes m2hFadeIn { from{opacity:0} to{opacity:1} }
                @keyframes m2hSlideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes m2hPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0.4)} 50%{box-shadow:0 0 0 12px rgba(34,211,238,0)} }
                @keyframes m2hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes m2hSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes m2hCountUp { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
            `}</style>

            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.8) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 24,
                    padding: "36px 32px 28px",
                    maxWidth: 440,
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    animation: "m2hSlideUp 0.35s cubic-bezier(.22,1,.36,1) both",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
            >
                {/* Top glow line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${milestone.color}, transparent)` }} />

                {/* Background orb */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${milestone.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Close */}
                <button onClick={close} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 6, cursor: "pointer", color: "#64748b", display: "flex", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#3D52A0"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#64748b"; }}>
                    <X size={14} />
                </button>

                {/* Company badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${milestone.color}20`, border: `1px solid ${milestone.color}40`, display: "flex", alignItems: "center", justifyContent: "center", animation: "m2hPulse 2.5s infinite" }}>
                        <Briefcase size={18} style={{ color: milestone.color }} />
                    </div>
                    <div>
                        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: milestone.color, opacity: 0.8, marginBottom: 2 }}>Currently Working At</p>
                        <p style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, color: "#1e293b", letterSpacing: "0.08em" }}>M2H Infotech</p>
                    </div>
                </div>

                {/* Big day counter */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Day Completed</p>
                    <div style={{
                        fontFamily: "'Orbitron', monospace", fontWeight: 900,
                        fontSize: "clamp(64px, 18vw, 88px)",
                        background: `linear-gradient(135deg, ${milestone.color}, #fff 50%, ${milestone.color})`,
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        animation: "m2hShimmer 3s linear infinite, m2hCountUp 0.5s cubic-bezier(.22,1,.36,1) both",
                        lineHeight: 1,
                    }}>
                        {day}
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 14px", borderRadius: 20, background: `${milestone.color}15`, border: `1px solid ${milestone.color}40` }}>
                        <Star size={11} style={{ color: milestone.color }} />
                        <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: milestone.color }}>{milestone.label}</span>
                    </div>
                </div>

                {/* Time breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {[
                        { val: years, label: "Years", icon: <Trophy size={13} /> },
                        { val: months, label: "Months", icon: <Calendar size={13} /> },
                        { val: days, label: "Days", icon: <Flame size={13} /> },
                    ].map(({ val, label, icon }) => (
                        <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                            <div style={{ color: "#64748b", marginBottom: 4, display: "flex", justifyContent: "center" }}>{icon}</div>
                            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{val}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginTop: 2 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Progress to 1 year */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569" }}>Progress to 1 Year</span>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: milestone.color }}>
                            {remaining > 0 ? `${remaining} days left` : "🎉 1 Year Achieved!"}
                        </span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", width: `${progress}%`, borderRadius: 99,
                            background: `linear-gradient(90deg, ${milestone.color}80, ${milestone.color})`,
                            boxShadow: `0 0 8px ${milestone.color}60`,
                            transition: "width 1s cubic-bezier(.22,1,.36,1)",
                        }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 8, color: "#334155" }}>Day 1</span>
                        <span style={{ fontFamily: "monospace", fontSize: 8, color: "#334155" }}>Day 365</span>
                    </div>
                </div>

                {/* Motivational message */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, textAlign: "center" }}>
                    <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600, color: "#94a3b8", lineHeight: 1.5 }}>
                        {day >= 365
                            ? "🎊 You've completed a full year! You're unstoppable, Shahid!"
                            : day >= 300
                            ? "🔥 Almost there! The finish line is in sight. Keep crushing it!"
                            : day >= 271
                            ? `💪 ${remaining} more days to your 1-year milestone. You've got this, Shahid!`
                            : "🚀 Every day is a step closer to greatness. Keep showing up!"}
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={close}
                    style={{
                        width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
                        background: `linear-gradient(135deg, ${milestone.color}30, ${milestone.color}15)`,
                        border: `1px solid ${milestone.color}50`,
                        color: milestone.color, fontFamily: "monospace", fontSize: 11,
                        letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700,
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${milestone.color}50, ${milestone.color}30)`; e.currentTarget.style.boxShadow = `0 0 20px ${milestone.color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${milestone.color}30, ${milestone.color}15)`; e.currentTarget.style.boxShadow = "none"; }}
                >
                    Let's Make Day {day + 1} Count 🚀
                </button>
            </div>
        </div>
    );
}
