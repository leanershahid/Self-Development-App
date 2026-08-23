import React, { useState, useEffect } from 'react';
import { Quote, Star, BookOpen, Film, Music, User, Sparkles, Heart, RefreshCw, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TodaysQuotes() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodaysQuotes();
    }, []);

    const loadTodaysQuotes = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('is_active', true)
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuotes(data || []);
        } catch (error) {
            console.error("Error loading today's quotes:", error);
        }
        setLoading(false);
    };

    const getDateStr = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const now = new Date();
        const day = days[now.getDay()];
        const date = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        return `${day}, ${month} ${date}, ${year}`;
    };

    const getSourceIcon = (source) => {
        const icons = {
            book: <BookOpen size={18} />,
            movie: <Film size={18} />,
            song: <Music size={18} />,
            personal: <User size={18} />,
            speech: <Quote size={18} />,
            internet: <Sparkles size={18} />
        };
        return icons[source] || <Quote size={18} />;
    };

    const getCategoryColor = (category) => {
        const colors = {
            motivation: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
            travel: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30',
            life: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
            success: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
            wisdom: 'from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30',
            love: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30'
        };
        return colors[category] || 'from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30';
    };

    const getMoodGradient = (mood) => {
        const gradients = {
            calm: 'from-blue-900/40 via-cyan-900/20 to-teal-900/20',
            intense: 'from-orange-900/40 via-red-900/20 to-rose-900/20',
            happy: 'from-yellow-900/40 via-amber-900/20 to-orange-900/20',
            sad: 'from-slate-900/60 via-blue-900/20 to-indigo-900/20',
            inspiring: 'from-fuchsia-900/40 via-purple-900/20 to-indigo-900/20',
            peaceful: 'from-emerald-900/40 via-teal-900/20 to-cyan-900/20'
        };
        return gradients[mood] || 'from-gray-900/60 to-slate-800/40';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <div className="text-indigo-400 font-mono text-sm tracking-widest uppercase animate-pulse">Decrypting Thoughts...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 px-4 animate-slideIn" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-4xl mx-auto">
                <style>{`
                  .quote-glass {
                    background: rgba(255,255,255,0.55);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(134,151,196,0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                  }
                  .quote-shimmer {
                    position: relative;
                    overflow: hidden;
                  }
                  .quote-shimmer::after {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%;
                    width: 200%; height: 200%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%);
                    transform: rotate(30deg);
                    animation: shimmer 6s infinite linear;
                    pointer-events: none;
                  }
                  @keyframes shimmer {
                    0% { transform: translateX(-100%) rotate(30deg); }
                    100% { transform: translateX(100%) rotate(30deg); }
                  }
                `}</style>

                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="quote-glass rounded-3xl p-6 mb-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[50px]"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <Quote className="text-indigo-400" size={32} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
                                Daily Transmission
                            </h1>
                            <p className="text-indigo-400/60 font-mono text-sm tracking-widest uppercase">{getDateStr()}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between quote-glass rounded-2xl p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                <Heart className="text-rose-400" size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-gray-200">{quotes.length}</div >
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">Intercepted Thoughts</div>
                            </div>
                        </div>
                        <button
                            onClick={loadTodaysQuotes}
                            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 text-sm font-medium tracking-wide"
                        >
                            <RefreshCw size={16} />
                            Resync
                        </button>
                    </div>
                </div>

                {/* Quotes Display */}
                {quotes.length === 0 ? (
                    <div className="quote-glass rounded-3xl p-12 text-center border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10"></div>
                        <div className="relative z-10 w-20 h-20 bg-gray-900 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
                            <Quote className="text-indigo-500/50 relative z-10" size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-2 tracking-wide">No Transmissions Received</h3>
                        <p className="text-gray-500 text-sm">Initialize sequence to generate inspiring thoughts.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {quotes.map((quote, index) => (
                            <div
                                key={quote.id}
                                className={`relative bg-gradient-to-br ${getMoodGradient(quote.mood)} quote-glass quote-shimmer rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/40 group`}
                                style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Quote size={80} strokeWidth={1} className="text-white" />
                                </div>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-cyan-500 opacity-50 rounded-l-2xl"></div>

                                <div className="relative z-10">
                                    {/* Tech Badges */}
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r border ${getCategoryColor(quote.category)}`}>
                                            {quote.category}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gray-900/60 border border-white/10 text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                            {getSourceIcon(quote.source)}
                                            {quote.source}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gray-900/60 border border-white/10 text-gray-400 uppercase tracking-wider">
                                            {quote.mood}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gray-900/60 border border-white/10 text-gray-400 uppercase tracking-wider">
                                            {quote.language}
                                        </span>
                                        {quote.is_featured && (
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 animate-pulse uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                                <Star size={12} className="fill-amber-400" />
                                                PRIME
                                            </span>
                                        )}
                                    </div>

                                    {/* Quote Content */}
                                    <div className="my-6 pl-4 border-l-2 border-indigo-500/30">
                                        <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed italic mb-4 drop-shadow-md">
                                            "{quote.quote_text}"
                                        </p>
                                        {quote.author && (
                                            <p className="text-sm text-cyan-400/80 font-mono tracking-wide flex items-center gap-2">
                                                <span className="w-4 h-[1px] bg-cyan-500/50"></span>
                                                {quote.author}
                                            </p>
                                        )}
                                    </div>

                                    {/* Footer Details */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">
                                            ENTRY_ID:<span className="text-indigo-400/70 ml-1">{quotes.length - index}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} className="text-gray-600" />
                                            {new Date(quote.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}