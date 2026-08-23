import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Delete } from "lucide-react";

const CORRECT_PIN = "8281";

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
        <div className="min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 p-10 rounded-3xl"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.75), rgba(173,187,218,0.35))", backdropFilter: "blur(20px) saturate(1.4)", border: "1px solid rgba(134,151,196,0.35)", boxShadow: "0 8px 32px rgba(61,82,160,0.15)" }}
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-2xl border border-[#7091E6]/40 text-[#3D52A0] shadow-[0_0_20px_rgba(112,145,230,0.25)]">
                        <Lock size={28} />
                    </div>
                    <p className="text-[#3D52A0]/70 font-mono text-sm tracking-widest uppercase">Enter PIN</p>
                </div>

                {/* Dots */}
                <div className="flex gap-4">
                    {[0, 1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ scale: pin.length > i ? 1.2 : 1 }}
                            className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                error ? "border-red-500 bg-red-500" :
                                pin.length > i ? "border-[#3D52A0] bg-[#3D52A0]" : "border-[#ADBBDA]"
                            }`}
                        />
                    ))}
                </div>

                {error && <p className="text-red-500 text-xs font-mono -mt-4">Incorrect PIN</p>}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => press(String(n))}
                            className="w-16 h-16 rounded-2xl text-[#3D52A0] text-xl font-bold transition-all
                                bg-white/50 hover:bg-[#7091E6]/20 border border-[#8697C4]/30 hover:border-[#7091E6]/60 active:scale-95">
                            {n}
                        </button>
                    ))}
                    <div />
                    <button onClick={() => press("0")}
                        className="w-16 h-16 rounded-2xl text-[#3D52A0] text-xl font-bold transition-all
                            bg-white/50 hover:bg-[#7091E6]/20 border border-[#8697C4]/30 hover:border-[#7091E6]/60 active:scale-95">
                        0
                    </button>
                    <button onClick={del}
                        className="w-16 h-16 rounded-2xl text-[#3D52A0]/70 flex items-center justify-center transition-all
                            bg-white/50 hover:bg-red-500/20 border border-[#8697C4]/30 hover:border-red-500/40 active:scale-95">
                        <Delete size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
