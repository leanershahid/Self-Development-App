import React, { useState, useEffect } from 'react';
import { Quote, Star, BookOpen, Film, Music, User, Sparkles, Heart, RefreshCw, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardBody, Badge, IconButton, EmptyState, SkeletonCard } from './ui';

const supabaseUrl = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';
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
            book: <BookOpen size={13} />,
            movie: <Film size={13} />,
            song: <Music size={13} />,
            personal: <User size={13} />,
            speech: <Quote size={13} />,
            internet: <Sparkles size={13} />
        };
        return icons[source] || <Quote size={13} />;
    };

    const getCategoryVariant = (category) => {
        const variants = {
            motivation: 'warning',
            travel: 'info',
            life: 'success',
            success: 'primary',
            wisdom: 'neutral',
            love: 'danger',
        };
        return variants[category] || 'neutral';
    };

    if (loading) return <SkeletonCard />;

    return (
        <Card>
            <CardHeader
                title="Today's Quotes"
                subtitle={getDateStr()}
                icon={<Quote size={18} />}
                action={
                    <IconButton label="Refresh" onClick={loadTodaysQuotes}>
                        <RefreshCw size={16} />
                    </IconButton>
                }
            />
            <CardBody className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                    <div className="w-9 h-9 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
                        <Heart size={16} />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-[var(--text)]">{quotes.length}</div>
                        <div className="text-xs text-[var(--text-muted)]">Quotes captured today</div>
                    </div>
                </div>

                {quotes.length === 0 ? (
                    <EmptyState icon={<Quote size={22} />} title="No quotes yet" message="Add an inspiring quote to see it here." />
                ) : (
                    <div className="flex flex-col gap-4">
                        {quotes.map((quote, index) => (
                            <div key={quote.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <Badge variant={getCategoryVariant(quote.category)}>{quote.category}</Badge>
                                    <Badge variant="neutral">
                                        <span className="flex items-center gap-1">{getSourceIcon(quote.source)} {quote.source}</span>
                                    </Badge>
                                    <Badge variant="neutral">{quote.mood}</Badge>
                                    <Badge variant="neutral">{quote.language}</Badge>
                                    {quote.is_featured && (
                                        <Badge variant="warning">
                                            <span className="flex items-center gap-1"><Star size={11} /> Featured</span>
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-lg text-[var(--text)] font-light leading-relaxed italic mb-2">
                                    "{quote.quote_text}"
                                </p>
                                {quote.author && <p className="text-sm text-[var(--text-muted)]">— {quote.author}</p>}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                                    <span>#{quotes.length - index}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {new Date(quote.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
