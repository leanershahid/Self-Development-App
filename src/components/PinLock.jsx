import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Delete } from "lucide-react";

// NOTE: this is a client-side convenience lock only, not real authentication —
// any PIN baked into the Vite bundle is readable by anyone who opens devtools.
const CORRECT_PIN = import.meta.env.VITE_APP_PIN;

export default function PinLock({ onUnlock }) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    function press(val) {
        if (pin.length >= 4) return;
        const next = pin + val;
        setPin(next);
        setError(false);
        if (next.length === 4) {
            if (next === CORRECT_PIN) {
                setTimeout(onUnlock, 200);
            } else {
                setError(true);
                setTimeout(() => { setPin(""); setError(false); }, 800);
            }
        }
    }

    function del() { setPin(p => p.slice(0, -1)); setError(false); }

    return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)]"
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Lock size={28} />
                    </div>
                    <p className="text-[var(--text-muted)] text-sm tracking-wide uppercase font-medium">Enter PIN</p>
                </div>

                {/* Dots */}
                <div className="flex gap-4">
                    {[0, 1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ scale: pin.length > i ? 1.2 : 1 }}
                            className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                error ? "border-danger bg-danger" :
                                pin.length > i ? "border-accent bg-accent" : "border-[var(--border)]"
                            }`}
                        />
                    ))}
                </div>

                {error && <p className="text-danger text-xs -mt-4">Incorrect PIN</p>}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => press(String(n))}
                            className="w-16 h-16 rounded-xl text-[var(--text)] text-xl font-semibold transition-all
                                bg-[var(--bg)] hover:bg-primary/10 border border-[var(--border)] hover:border-primary/30 active:scale-95">
                            {n}
                        </button>
                    ))}
                    <div />
                    <button onClick={() => press("0")}
                        className="w-16 h-16 rounded-xl text-[var(--text)] text-xl font-semibold transition-all
                            bg-[var(--bg)] hover:bg-primary/10 border border-[var(--border)] hover:border-primary/30 active:scale-95">
                        0
                    </button>
                    <button onClick={del}
                        className="w-16 h-16 rounded-xl text-[var(--text-muted)] flex items-center justify-center transition-all
                            bg-[var(--bg)] hover:bg-danger/10 border border-[var(--border)] hover:border-danger/30 active:scale-95">
                        <Delete size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
