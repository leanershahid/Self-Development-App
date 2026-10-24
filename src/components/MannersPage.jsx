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
import { Card, CardHeader, CardBody } from "./ui";

const MANNERS = [
    {
        title: "Don't Smoke",
        description: "Smoking is not only harmful to your health but also unpleasant for those around you. A gentleman respects the comfort of others.",
        icon: <Heart className="text-rose-500" />
    },
    {
        title: "Respect Everyone",
        description: "Treat everyone with respect—regardless of their status, job, or background. A gentleman is kind to everyone, not just when it benefits him.",
        icon: <Heart className="text-rose-500" />
    },
    {
        title: "Good Listening Skills",
        description: "Don’t just wait for your turn to speak. Listen actively, maintain eye contact, and show genuine interest.",
        icon: <Ear className="text-cyan-500" />
    },
    {
        title: "Politeness & Basic Courtesy",
        description: "Simple words matter: 'Please', 'Thank you', 'Excuse me'. They instantly elevate your personality.",
        icon: <Smile className="text-emerald-500" />
    },
    {
        title: "Keep Your Word",
        description: "If you promise something, follow through. Reliability is one of the strongest traits of a gentleman.",
        icon: <ShieldCheck className="text-blue-500" />
    },
    {
        title: "Personal Hygiene & Grooming",
        description: "Clean clothes, fresh breath, neat appearance—these show self-respect and respect for others.",
        icon: <Sparkles className="text-purple-500" />
    },
    {
        title: "Control Your Emotions",
        description: "Stay calm, especially in tough situations. A gentleman doesn’t lose his temper easily.",
        icon: <Wind className="text-teal-500" />
    },
    {
        title: "Respect Women",
        description: "Treat women with dignity—no inappropriate jokes, staring, or disrespectful behavior.",
        icon: <Gem className="text-pink-500" />
    },
    {
        title: "Be Punctual",
        description: "Value other people’s time. Being on time shows discipline and professionalism.",
        icon: <Clock className="text-orange-500" />
    },
    {
        title: "Table Manners",
        description: "Don’t speak with your mouth full, use utensils properly, and avoid using your phone at the table.",
        icon: <Utensils className="text-yellow-500" />
    },
    {
        title: "Help Others",
        description: "Offer help when needed—holding a door, assisting someone, or simply being considerate.",
        icon: <HelpingHand className="text-indigo-500" />
    },
    {
        title: "Take Responsibility",
        description: "Own your mistakes instead of blaming others. Accountability builds respect.",
        icon: <UserCheck className="text-green-500" />
    },
    {
        title: "Speak Well",
        description: "Avoid abusive language and gossip. Speak clearly, respectfully, and thoughtfully.",
        icon: <Quote className="text-slate-500" />
    },
    {
        title: "Control Your Mind",
        description: "Don't react instantly—pause and think. Anger, jealousy, ego → control them, don't let them control you. A mature man is known by how he reacts under pressure.",
        icon: <Brain className="text-violet-500" />
    },
    {
        title: "Take Responsibility",
        description: "Stop blaming others. Accept mistakes, fix them, and improve. Be reliable: if you say something, do it. Responsibility earns respect from others.",
        icon: <Shield className="text-green-500" />
    },
    {
        title: "Keep Learning",
        description: "Learn useful skills—communication, tech, money management. Master one strong skill. Skilled people don't chase success—success comes to them.",
        icon: <BookOpen className="text-amber-500" />
    },
    {
        title: "Speak Less, Speak Smart",
        description: "Don't talk too much. Listen more, understand people. Speak clearly, calmly, and only when needed. Silence + clarity = strong presence.",
        icon: <MessageSquare className="text-sky-500" />
    },
    {
        title: "Build Discipline",
        description: "Wake up on time. Take care of your body—exercise and hygiene. Be consistent even when you don't feel like it. Discipline beats motivation every time.",
        icon: <Dumbbell className="text-red-500" />
    },
    {
        title: "Understand Money Early",
        description: "Save money, don't waste on showing off. Learn basic finance—saving and investing. Avoid unnecessary debt. Handling money wisely defines your character.",
        icon: <Wallet className="text-lime-500" />
    },
    {
        title: "Choose People Carefully",
        description: "Stay away from drama, fake friends, and negativity. Keep a small circle of real people. Don't try to impress everyone. Your circle shapes your future.",
        icon: <Users className="text-fuchsia-500" />
    },
    {
        title: "Respect Yourself First",
        description: "Don't beg for attention or validation. Set boundaries even with close people. Know your worth, but stay humble. Self-respect = real confidence.",
        icon: <UserCheck className="text-blue-500" />
    },
    {
        title: "Balance Ego & Humility",
        description: "Be confident, but not arrogant. Accept when you're wrong. Always stay open to learning. Ego destroys growth, humility builds it.",
        icon: <Scale className="text-orange-500" />
    },
    {
        title: "Be Patient",
        description: "Don't expect instant results. Work daily, improve slowly. Trust the process. Strong men are built over years, not days.",
        icon: <Timer className="text-teal-500" />
    }
];

export default function MannersPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
                <Card>
                    <CardBody className="flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Star size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
                            The Gentleman's Code
                        </h1>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.25em]">
                            Protocol • Integrity • Excellence
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader
                        title="23 Principles to Live By"
                        subtitle="A daily reference for conduct and character"
                        icon={<ShieldCheck size={18} />}
                    />
                    <CardBody className="p-0 divide-y divide-[var(--border)]">
                        {MANNERS.map((manner, index) => (
                            <motion.div
                                key={index}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: Math.min(index * 0.03, 0.6) }}
                                className="flex gap-4 p-5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                    {manner.icon}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
                                        {manner.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                        {manner.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <p className="text-sm italic text-[var(--text-muted)]">
                            "Becoming a legend is not about showing others — it's about becoming someone you respect when you're alone."
                        </p>
                    </CardBody>
                </Card>
            </div>
        </motion.div>
    );
}
