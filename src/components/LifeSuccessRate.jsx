import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell, RadialBarChart, RadialBar,
    PolarAngleAxis
} from 'recharts';
import { TrendingDown, Flame, Target, Zap, Award, BarChart3, Activity, Grid3x3 } from 'lucide-react';
import { Card, CardHeader, CardBody, KpiCard, Badge, Tabs, EmptyState, SkeletonCard } from './ui';
import { supabase } from '../supabase';
import { buildDayMap, computeOverallRate, computeStreaks } from '../utils/todoStats';
import AchievementProgressKpi from './AchievementProgressKpi';

function getRating(rate) {
    if (rate >= 90) return { label: 'Legendary', variant: 'success', color: '#10b981' };
    if (rate >= 75) return { label: 'Elite', variant: 'success', color: '#10b981' };
    if (rate >= 60) return { label: 'Solid', variant: 'info', color: '#2563eb' };
    if (rate >= 45) return { label: 'Average', variant: 'warning', color: '#d97706' };
    return { label: 'Struggling', variant: 'danger', color: '#dc2626' };
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 shadow-[var(--shadow-md)]">
            <p className="text-[var(--text-muted)] text-[11px] font-mono mb-1">{label}</p>
            <p className="text-primary font-bold text-sm">{d?.rate?.toFixed(1)}% success</p>
            <p className="text-accent text-xs mt-1">done {d?.completed}</p>
            <p className="text-danger text-xs">failed {d?.failed}</p>
        </div>
    );
};

export default function LifeSuccessRate() {
    const [allData, setAllData] = useState([]);
    const [rawDayMap, setRawDayMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('composed'); // 'composed' | 'radial' | 'heatmap'

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ToDo')
                .select('created_at, completed, active')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Canonical day grouping: only active rows count, same as every other Progress tab.
            const dayMap = buildDayMap(data);
            setRawDayMap(dayMap);

            const chartData = Object.entries(dayMap)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([day, d]) => ({
                    date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    fullDate: day,
                    rate: d.total > 0 ? parseFloat(((d.done / d.total) * 100).toFixed(1)) : 0,
                    completed: d.done,
                    failed: d.total - d.done,
                    total: d.total,
                }));

            setAllData(chartData);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const { rate: overallRate, totalCompleted, totalTasks } = computeOverallRate(rawDayMap);
    const totalFailed = totalTasks - totalCompleted;
    const bestDay = allData.reduce((best, d) => d.rate > (best?.rate ?? -1) ? d : best, null);
    const worstDay = allData.reduce((worst, d) => d.rate < (worst?.rate ?? 101) ? d : worst, null);
    const { currentStreak: streak } = computeStreaks(rawDayMap, 50);

    const rating = getRating(overallRate);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
                <SkeletonCard />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <SkeletonCard className="h-80" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
                    <Activity size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Life Success Rate</h1>
                <p className="text-sm text-[var(--text-muted)]">Full journey · achievement graph · all-time stats</p>
            </div>

            {/* Overall rate card */}
            <Card>
                <CardBody className="text-center py-8">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
                        Overall Life Rating
                    </p>
                    <div className="text-6xl md:text-7xl font-black text-[var(--text)] mb-3 tabular-nums">
                        {overallRate.toFixed(1)}<span className="text-2xl md:text-3xl text-[var(--text-muted)]">%</span>
                    </div>
                    <Badge variant={rating.variant}>{rating.label}</Badge>

                    <div className="mt-6 w-full max-w-lg mx-auto h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                            style={{ width: `${overallRate}%` }}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard icon={<Target size={18} />} label="Total Tasks" value={totalCompleted + totalFailed} tone="primary" />
                <KpiCard icon={<Zap size={18} />} label="Achieved" value={totalCompleted} tone="accent" />
                <KpiCard icon={<TrendingDown size={18} />} label="Failed" value={totalFailed} tone="danger" />
                <KpiCard icon={<Flame size={18} />} label="Win Streak" value={streak} unit="days" tone="warning" />
                <AchievementProgressKpi />
            </div>

            {/* Best / Worst */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardBody className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                            <Award size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Best Day</p>
                            <p className="font-semibold text-[var(--text)]">{bestDay?.date ?? '—'}</p>
                            <p className="text-sm text-warning">
                                {bestDay?.rate?.toFixed(1) ?? 0}% · {bestDay?.completed ?? 0} done / {bestDay?.failed ?? 0} failed
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                            <TrendingDown size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Worst Day</p>
                            <p className="font-semibold text-[var(--text)]">{worstDay?.date ?? '—'}</p>
                            <p className="text-sm text-danger">
                                {worstDay?.rate?.toFixed(1) ?? 0}% · {worstDay?.completed ?? 0} done / {worstDay?.failed ?? 0} failed
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Full Life Graph */}
            <Card>
                <CardHeader
                    title="Full Life Graph"
                    subtitle={`${allData.length} days tracked · every achievement & fail`}
                />
                <CardBody>
                    <Tabs
                        tabs={[
                            { value: 'composed', label: 'Pulse' },
                            { value: 'radial', label: 'Radial' },
                            { value: 'heatmap', label: 'Heatmap' },
                        ]}
                        value={view}
                        onChange={setView}
                        className="mb-6"
                    />

                    {allData.length === 0 ? (
                        <EmptyState
                            icon={<BarChart3 size={20} />}
                            title="No data yet"
                            message="Complete some tasks to start building your life graph."
                        />
                    ) : (
                        <>
                            {view === 'composed' && (
                                <div>
                                    {/* Composed: stacked bars (done/failed) + success rate line */}
                                    <div className="h-80 w-full rounded-xl p-4 bg-[var(--surface-hover)] border border-[var(--border)]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={allData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={0}>
                                                <defs>
                                                    <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                                        <stop offset="100%" stopColor="#0ea371" stopOpacity={0.6} />
                                                    </linearGradient>
                                                    <linearGradient id="failGrad2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                                                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.4} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="2 6" stroke="rgba(245,247,250,0.12)" vertical={false} />
                                                <XAxis dataKey="date" stroke="rgba(245,247,250,0.12)" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                                <YAxis yAxisId="tasks" stroke="rgba(245,247,250,0.12)" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="rate" orientation="right" stroke="rgba(245,247,250,0.12)" tick={{ fill: '#8b95a5', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} unit="%" />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,58,95,0.04)' }} />
                                                <ReferenceLine yAxisId="rate" y={50} stroke="#cbd5e1" strokeDasharray="4 4" />
                                                <ReferenceLine yAxisId="rate" y={overallRate} stroke="#1e3a5f" strokeDasharray="6 3" strokeOpacity={0.6}
                                                    label={{ value: `${overallRate.toFixed(0)}%`, fill: '#1e3a5f', fontSize: 10, position: 'insideTopRight' }} />
                                                <Bar yAxisId="tasks" dataKey="completed" stackId="a" fill="url(#doneGrad)" radius={[0, 0, 0, 0]} maxBarSize={20} />
                                                <Bar yAxisId="tasks" dataKey="failed" stackId="a" fill="url(#failGrad2)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                                                <Line yAxisId="rate" type="monotoneX" dataKey="rate" stroke="#1e3a5f" strokeWidth={2.5}
                                                    dot={false} activeDot={{ r: 5, fill: '#1e3a5f', stroke: '#ffffff', strokeWidth: 2 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-5 mt-4 justify-center">
                                        {[
                                            { color: '#10b981', label: 'Completed tasks' },
                                            { color: '#dc2626', label: 'Failed tasks' },
                                            { color: '#1e3a5f', label: 'Success rate %' },
                                        ].map((l, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-6 h-1.5 rounded-full" style={{ background: l.color }} />
                                                <span className="text-[11px] text-[var(--text-muted)]">{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'radial' && (
                                <div>
                                    {/* Radial bar — last 8 days */}
                                    {(() => {
                                        const last8 = [...allData].slice(-8).map(d => ({
                                            ...d,
                                            fill: d.rate >= 75 ? '#10b981' : d.rate >= 50 ? '#2563eb' : d.rate >= 25 ? '#d97706' : '#dc2626',
                                        }));
                                        return (
                                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                                <div className="h-80 w-full rounded-xl p-4 relative bg-[var(--surface-hover)] border border-[var(--border)]">
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="text-center">
                                                            <div className="text-3xl font-black tabular-nums text-[var(--text)]">
                                                                {overallRate.toFixed(0)}%
                                                            </div>
                                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">avg rate</div>
                                                        </div>
                                                    </div>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
                                                            data={last8} startAngle={180} endAngle={-180}>
                                                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                                            <RadialBar background={{ fill: 'rgba(245,247,250,0.12)' }} dataKey="rate" angleAxisId={0} cornerRadius={6}>
                                                                {last8.map((entry, i) => (
                                                                    <Cell key={i} fill={entry.fill} />
                                                                ))}
                                                            </RadialBar>
                                                            <Tooltip content={<CustomTooltip />} />
                                                        </RadialBarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                {/* Side labels */}
                                                <div className="flex flex-row lg:flex-col gap-2 flex-wrap justify-center lg:justify-start lg:min-w-[140px]">
                                                    {last8.map((d, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                                                            <span className="text-[11px] text-[var(--text-muted)]">{d.date}</span>
                                                            <span className="text-[11px] font-bold ml-auto" style={{ color: d.fill }}>{d.rate}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {view === 'heatmap' && (
                                <div>
                                    {/* GitHub-style heatmap */}
                                    {(() => {
                                        const dataMap = new Map(allData.map(d => [d.fullDate, d]));
                                        const today = new Date();
                                        const weeks = 18;
                                        const days = weeks * 7;
                                        const cells = [];
                                        for (let i = days - 1; i >= 0; i--) {
                                            const d = new Date(today);
                                            d.setDate(today.getDate() - i);
                                            const key = d.toISOString().split('T')[0];
                                            const entry = dataMap.get(key);
                                            cells.push({ key, entry, dow: d.getDay(), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
                                        }
                                        const grid = [];
                                        for (let w = 0; w < weeks; w++) grid.push(cells.slice(w * 7, w * 7 + 7));

                                        const getColor = (entry) => {
                                            if (!entry) return '#e2e8f0';
                                            if (entry.rate >= 75) return '#10b981';
                                            if (entry.rate >= 50) return '#2563eb';
                                            if (entry.rate >= 25) return '#d97706';
                                            return '#dc2626';
                                        };

                                        return (
                                            <div className="rounded-xl p-5 bg-[var(--surface-hover)] border border-[var(--border)]">
                                                <div className="flex gap-1 overflow-x-auto pb-2">
                                                    {grid.map((week, wi) => (
                                                        <div key={wi} className="flex flex-col gap-1">
                                                            {week.map((cell, di) => (
                                                                <div key={di} title={cell.entry ? `${cell.label}: ${cell.entry.rate}% (done ${cell.entry.completed}, failed ${cell.entry.failed})` : cell.label}
                                                                    className="w-4 h-4 rounded-sm cursor-pointer transition-transform duration-150 hover:scale-125"
                                                                    style={{ background: getColor(cell.entry) }} />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[11px] text-[var(--text-muted)]">18 weeks ago</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[var(--text-muted)]">Less</span>
                                                        {['#e2e8f0', '#dc2626', '#d97706', '#2563eb', '#10b981'].map((c, i) => (
                                                            <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
                                                        ))}
                                                        <span className="text-[11px] text-[var(--text-muted)]">More</span>
                                                    </div>
                                                    <span className="text-[11px] text-[var(--text-muted)]">Today</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Day-by-day breakdown */}
            {allData.length > 0 && (
                <Card>
                    <CardHeader title="Day-by-Day Breakdown" subtitle="Every single day of your journey" />
                    <CardBody>
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                            {[...allData].reverse().map((d, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-[var(--surface-hover)]">
                                    <div className="w-20 text-[11px] text-[var(--text-muted)] flex-shrink-0">{d.date}</div>
                                    <div className="flex-1 h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${d.rate}%` }} />
                                    </div>
                                    <div className="w-14 text-right text-xs font-bold text-[var(--text)]">{d.rate}%</div>
                                    <div className="hidden sm:flex items-center gap-2 text-[11px] w-28 flex-shrink-0">
                                        <span className="text-accent">+{d.completed}</span>
                                        <span className="text-danger">-{d.failed}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

        </div>
    );
}
