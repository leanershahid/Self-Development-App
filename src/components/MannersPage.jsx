import React from "react";
import { motion } from "framer-motion";
import {
    Heart,
    Ear,
    Smile,
    ShieldCheck,
    Sparkles,
    Wind,
    Gem,
    Clock,
    Utensils,
    HelpingHand,
    UserCheck,
    Quote,
    Star,
    Brain,
    BookOpen,
    MessageSquare,
    Dumbbell,
    Wallet,
    Users,
    Shield,
    Scale,
    Timer
} from "lucide-react";
import Navbar from "./NavBar";

const MANNERS = [
      {
        title: "Don't Smoke",
        description: "Smoking is not only harmful to your health but also unpleasant for those around you. A gentleman respects the comfort of others.",
        icon: <Heart className="text-rose-400" />
    },
    {
        title: "Respect Everyone",
        description: "Treat everyone with respect—regardless of their status, job, or background. A gentleman is kind to everyone, not just when it benefits him.",
        icon: <Heart className="text-rose-400" />
    },
    {
        title: "Good Listening Skills",
        description: "Don’t just wait for your turn to speak. Listen actively, maintain eye contact, and show genuine interest.",
        icon: <Ear className="text-cyan-400" />
    },
    {
        title: "Politeness & Basic Courtesy",
        description: "Simple words matter: 'Please', 'Thank you', 'Excuse me'. They instantly elevate your personality.",
        icon: <Smile className="text-emerald-400" />
    },
    {
        title: "Keep Your Word",
        description: "If you promise something, follow through. Reliability is one of the strongest traits of a gentleman.",
        icon: <ShieldCheck className="text-blue-400" />
    },
    {
        title: "Personal Hygiene & Grooming",
        description: "Clean clothes, fresh breath, neat appearance—these show self-respect and respect for others.",
        icon: <Sparkles className="text-purple-400" />
    },
    {
        title: "Control Your Emotions",
        description: "Stay calm, especially in tough situations. A gentleman doesn’t lose his temper easily.",
        icon: <Wind className="text-teal-400" />
    },
    {
        title: "Respect Women",
        description: "Treat women with dignity—no inappropriate jokes, staring, or disrespectful behavior.",
        icon: <Gem className="text-pink-400" />
    },
    {
        title: "Be Punctual",
        description: "Value other people’s time. Being on time shows discipline and professionalism.",
        icon: <Clock className="text-orange-400" />
    },
    {
        title: "Table Manners",
        description: "Don’t speak with your mouth full, use utensils properly, and avoid using your phone at the table.",
        icon: <Utensils className="text-yellow-400" />
    },
    {
        title: "Help Others",
        description: "Offer help when needed—holding a door, assisting someone, or simply being considerate.",
        icon: <HelpingHand className="text-indigo-400" />
    },
    {
        title: "Take Responsibility",
        description: "Own your mistakes instead of blaming others. Accountability builds respect.",
        icon: <UserCheck className="text-green-400" />
    },
    {
        title: "Speak Well",
        description: "Avoid abusive language and gossip. Speak clearly, respectfully, and thoughtfully.",
        icon: <Quote className="text-slate-400" />
    },
    {
        title: "Control Your Mind",
        description: "Don't react instantly—pause and think. Anger, jealousy, ego → control them, don't let them control you. A mature man is known by how he reacts under pressure.",
        icon: <Brain className="text-violet-400" />
    },
    {
        title: "Take Responsibility",
        description: "Stop blaming others. Accept mistakes, fix them, and improve. Be reliable: if you say something, do it. Responsibility earns respect from others.",
        icon: <Shield className="text-green-400" />
    },
    {
        title: "Keep Learning",
        description: "Learn useful skills—communication, tech, money management. Master one strong skill. Skilled people don't chase success—success comes to them.",
        icon: <BookOpen className="text-amber-400" />
    },
    {
        title: "Speak Less, Speak Smart",
        description: "Don't talk too much. Listen more, understand people. Speak clearly, calmly, and only when needed. Silence + clarity = strong presence.",
        icon: <MessageSquare className="text-sky-400" />
    },
    {
        title: "Build Discipline",
        description: "Wake up on time. Take care of your body—exercise and hygiene. Be consistent even when you don't feel like it. Discipline beats motivation every time.",
        icon: <Dumbbell className="text-red-400" />
    },
    {
        title: "Understand Money Early",
        description: "Save money, don't waste on showing off. Learn basic finance—saving and investing. Avoid unnecessary debt. Handling money wisely defines your character.",
        icon: <Wallet className="text-lime-400" />
    },
    {
        title: "Choose People Carefully",
        description: "Stay away from drama, fake friends, and negativity. Keep a small circle of real people. Don't try to impress everyone. Your circle shapes your future.",
        icon: <Users className="text-fuchsia-400" />
    },
    {
        title: "Respect Yourself First",
        description: "Don't beg for attention or validation. Set boundaries even with close people. Know your worth, but stay humble. Self-respect = real confidence.",
        icon: <UserCheck className="text-blue-400" />
    },
    {
        title: "Balance Ego & Humility",
        description: "Be confident, but not arrogant. Accept when you're wrong. Always stay open to learning. Ego destroys growth, humility builds it.",
        icon: <Scale className="text-orange-400" />
    },
    {
        title: "Be Patient",
        description: "Don't expect instant results. Work daily, improve slowly. Trust the process. Strong men are built over years, not days.",
        icon: <Timer className="text-teal-400" />
    }
];

export default function MannersPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#020617] text-slate-200"
        >
            <Navbar />
            <style>{`
        .dash-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .manner-card {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .manner-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 229, 255, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.1);
        }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-3 dash-glass rounded-2xl mb-6 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        <Star size={32} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-4 tracking-tight">
                        THE GENTLEMAN'S CODE
                    </h1>
                    <p className="text-cyan-400/60 font-mono text-sm tracking-[0.3em] uppercase">
                        Protocol • Integrity • Excellence
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MANNERS.map((manner, index) => (
                        <motion.div
                            key={index}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="dash-glass manner-card p-8 rounded-3xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                {React.cloneElement(manner.icon, { size: 120 })}
                            </div>

                            <div className="relative z-10">
                                <div className="mb-6 p-3 inline-block bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
                                    {React.cloneElement(manner.icon, { size: 28 })}
                                </div>

                                <h3 className="text-xl font-bold text-[#3D52A0] mb-4 group-hover:text-cyan-400 transition-colors">
                                    {manner.title}
                                </h3>

                                <p className="text-slate-400 leading-relaxed text-sm font-medium">
                                    {manner.description}
                                </p>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/50 transition-all duration-700" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-20 text-center"
                >
                    <div className="inline-block px-8 py-4 dash-glass rounded-2xl border border-white/5">
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest italic">
                            "Becoming a legend is not about showing others — it's about becoming someone you respect when you're alone."
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
