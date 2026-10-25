import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, Award, Target, CheckCircle, XCircle, BarChart3, Sparkles, Zap, Activity, CircleDot, Circle, RefreshCw, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardBody, KpiCard, Tabs, Table, Badge, Button, Input, DateField, EmptyState, SkeletonCard, useToast } from './ui';
import { supabase } from '../supabase';
import { getWeekRange, getMonthRange } from '../utils/todoStats';
import AchievementProgressKpi from './AchievementProgressKpi';

export default function PerformanceDashboard() {
  const toast = useToast();
  const [dailySummary, setDailySummary] = useState(null);
  const [dailyPoints, setDailyPoints] = useState(null);
  const [dailyPerformance, setDailyPerformance] = useState(null);
  const [weeklyPoints, setWeeklyPoints] = useState(null);
  const [monthlyPoints, setMonthlyPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pointsInput, setPointsInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [todos, setTodos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [_weeklyScores, setWeeklyScores] = useState([]);
  const [cycleTab, setCycleTab] = useState('week');

  useEffect(() => {
    loadDashboardData();
    loadPerformanceHistory();
    loadWeeklyScores();
  }, []);

  useEffect(() => {
    loadTodosByDate(selectedDate);
  }, [selectedDate]);

  const calculateWeeklyPoints = async () => {
    try {
      const { start: weekStart, end: weekEnd } = getWeekRange(0);

      const { data: todos, error: todosError } = await supabase
        .from('ToDo')
        .select('*')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (todosError) throw todosError;

      const activeTasks = todos.filter(t => t.active);
      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.completed).length;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
      const weekScore = Math.round(completionRate * 10);

      const { data: existing } = await supabase
        .from('weekly_points')
        .select('*')
        .eq('week_start', weekStart.toISOString().split('T')[0])
        .maybeSingle();

      let result;
      if (existing) {
        const { data } = await supabase
          .from('weekly_points')
          .update({
            total_points: weekScore,
            week_end: weekEnd.toISOString().split('T')[0]
          })
          .eq('week_start', weekStart.toISOString().split('T')[0])
          .select()
          .single();
        result = data;
      } else {
        const { data } = await supabase
          .from('weekly_points')
          .insert({
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            total_points: weekScore
          })
          .select()
          .single();
        result = data;
      }

      setWeeklyPoints(result);
      await loadPerformanceHistory();
      await loadWeeklyScores();
      toast.success(`Weekly points calculated! Score: ${weekScore}/10 — Completed: ${completedTasks}/${totalTasks} tasks (${(completionRate * 100).toFixed(0)}%)`);
    } catch (error) {
      console.error("Error calculating weekly points:", error);
      toast.error('Failed to calculate weekly points: ' + error.message);
    }
  };

  const calculateMonthlyPoints = async () => {
    try {
      const { start: monthStart, end: monthEnd } = getMonthRange(0);
      const month = monthStart.getMonth() + 1;
      const year = monthStart.getFullYear();

      const { data: todos, error: todosError } = await supabase
        .from('ToDo')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (todosError) throw todosError;

      const activeTasks = todos.filter(t => t.active);
      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.completed).length;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
      const monthScore = Math.round(completionRate * 10);

      const { data: existing } = await supabase
        .from('monthly_points')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      let result;
      if (existing) {
        const { data } = await supabase
          .from('monthly_points')
          .update({
            total_points: monthScore
          })
          .eq('month', month)
          .eq('year', year)
          .select()
          .single();
        result = data;
      } else {
        const { data } = await supabase
          .from('monthly_points')
          .insert({
            month,
            year,
            total_points: monthScore
          })
          .select()
          .single();
        result = data;
      }

      setMonthlyPoints(result);
      await loadPerformanceHistory();
      await loadWeeklyScores();
      toast.success(`Monthly points calculated! Score: ${monthScore}/10 — Completed: ${completedTasks}/${totalTasks} tasks (${(completionRate * 100).toFixed(0)}%)`);
    } catch (error) {
      console.error("Error calculating monthly points:", error);
      toast.error('Failed to calculate monthly points: ' + error.message);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: summary } = await supabase.from('daily_todo_summary').select('*').eq('day', today).maybeSingle();
      setDailySummary(summary);
      const { data: points } = await supabase.from('daily_points').select('*').eq('day', today).maybeSingle();
      setDailyPoints(points);
      const { data: performance } = await supabase.from('daily_performance').select('*').eq('day', today).maybeSingle();
      setDailyPerformance(performance);
      const { data: weekly } = await supabase.from('weekly_points').select('*').order('week_start', { ascending: false }).limit(1).maybeSingle();
      setWeeklyPoints(weekly);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: monthly } = await supabase.from('monthly_points').select('*').eq('month', currentMonth).eq('year', currentYear).maybeSingle();
      setMonthlyPoints(monthly);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
    setLoading(false);
  };

  const loadTodosByDate = async (date) => {
    try {
      const { data, error } = await supabase.from('ToDo').select('*').gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`).order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error("Error loading todos:", error);
    }
  };

  const loadPerformanceHistory = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase.from('daily_performance').select('day, completion_percentage, performance_status').gte('day', thirtyDaysAgo.toISOString().split('T')[0]).order('day', { ascending: true });
      if (error) throw error;
      const formattedData = (data || []).map(item => ({
        date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: parseFloat(item.completion_percentage),
        status: item.performance_status
      }));
      setPerformanceHistory(formattedData);
    } catch (error) {
      console.error("Error loading performance history:", error);
    }
  };

  const loadWeeklyScores = async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data, error } = await supabase.from('daily_points').select('day, points').gte('day', ninetyDaysAgo.toISOString().split('T')[0]).order('day', { ascending: true });
      if (error) throw error;
      // Canonical real Mon-Sun calendar weeks, same convention as the rest of Progress.
      const weekMap = new Map();
      (data || []).forEach(item => {
        const itemDate = new Date(item.day);
        itemDate.setHours(0, 0, 0, 0);
        const day = itemDate.getDay();
        const weekStart = new Date(itemDate);
        weekStart.setDate(itemDate.getDate() - ((day + 6) % 7));
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekKey)) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekMap.set(weekKey, { weekStart, weekEnd, totalScore: 0, days: 0 });
        }
        const week = weekMap.get(weekKey);
        week.totalScore += item.points;
        week.days += 1;
      });
      const weeklyData = Array.from(weekMap.values()).sort((a, b) => b.weekStart - a.weekStart).slice(0, 8);
      setWeeklyScores(weeklyData);
    } catch (error) {
      console.error("Error loading weekly scores:", error);
    }
  };

  const updateDailyPoints = async () => {
    const points = parseInt(pointsInput);
    if (isNaN(points) || points < 0 || points > 10) { toast.error('Points must be between 0 and 10'); return; }
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: existing } = await supabase.from('daily_points').select('*').eq('day', today).maybeSingle();
      let result;
      if (existing) {
        const { data, error } = await supabase.from('daily_points').update({ points: points, reason: reasonInput || null }).eq('day', today).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('daily_points').insert({ day: today, points: points, reason: reasonInput || null }).select().single();
        if (error) throw error;
        result = data;
      }
      setDailyPoints(result);
      setPointsInput('');
      setReasonInput('');
      await loadPerformanceHistory();
      await loadWeeklyScores();
      toast.success('Daily points updated successfully!');
    } catch (error) {
      console.error("Error updating points:", error);
      toast.error('Failed to update points: ' + error.message);
    }
  };

  const calculateDailySummary = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: todos, error } = await supabase.from('ToDo').select('*').gte('created_at', today + 'T00:00:00').lte('created_at', today + 'T23:59:59');
      if (error) throw error;
      const activeTodos = todos.filter(t => t.active);
      const total = activeTodos.length;
      const completed = activeTodos.filter(t => t.completed).length;
      const failed = activeTodos.filter(t => !t.completed).length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      let status = 'poor';
      if (percentage >= 90) status = 'excellent';
      else if (percentage >= 70) status = 'good';
      else if (percentage >= 50) status = 'average';
      const autoPoints = Math.round((percentage / 100) * 10);

      const { data: existingSummary } = await supabase.from('daily_todo_summary').select('*').eq('day', today).maybeSingle();
      const { data: existingPerf } = await supabase.from('daily_performance').select('*').eq('day', today).maybeSingle();
      const { data: existingPoints } = await supabase.from('daily_points').select('*').eq('day', today).maybeSingle();

      let summaryResult, perfResult, pointsResult;

      if (existingSummary) {
        const { data } = await supabase.from('daily_todo_summary').update({ total_todos: total, completed_todos: completed, failed_todos: failed }).eq('day', today).select().single();
        summaryResult = data;
      } else {
        const { data } = await supabase.from('daily_todo_summary').insert({ day: today, total_todos: total, completed_todos: completed, failed_todos: failed }).select().single();
        summaryResult = data;
      }

      if (existingPerf) {
        const { data } = await supabase.from('daily_performance').update({ completion_percentage: percentage.toFixed(2), performance_status: status }).eq('day', today).select().single();
        perfResult = data;
      } else {
        const { data } = await supabase.from('daily_performance').insert({ day: today, completion_percentage: percentage.toFixed(2), performance_status: status }).select().single();
        perfResult = data;
      }

      if (existingPoints) {
        const { data } = await supabase.from('daily_points').update({ points: autoPoints, reason: `Auto-calculated: ${completed}/${total} tasks completed (${percentage.toFixed(0)}%)` }).eq('day', today).select().single();
        pointsResult = data;
      } else {
        const { data } = await supabase.from('daily_points').insert({ day: today, points: autoPoints, reason: `Auto-calculated: ${completed}/${total} tasks completed (${percentage.toFixed(0)}%)` }).select().single();
        pointsResult = data;
      }

      setDailySummary(summaryResult);
      setDailyPerformance(perfResult);
      setDailyPoints(pointsResult);
      await loadPerformanceHistory();
      await loadWeeklyScores();
      toast.success('Daily summary recalculated successfully!');
    } catch (error) {
      console.error("Error calculating summary:", error);
      toast.error('Failed to calculate summary: ' + error.message);
    }
  };

  const getPerformanceNotification = (score) => {
    if (score >= 9) return { icon: '🔥', text: 'Outstanding! You\'re crushing it!', color: 'emerald' };
    if (score >= 8) return { icon: '⭐', text: 'Excellent work! Keep it up!', color: 'sky' };
    if (score >= 7) return { icon: '👍', text: 'Good job! Solid performance!', color: 'blue' };
    if (score >= 6) return { icon: '📈', text: 'Nice progress! Almost there!', color: 'cyan' };
    if (score >= 5) return { icon: '💪', text: 'Keep pushing! You can do better!', color: 'amber' };
    if (score >= 4) return { icon: '⚡', text: 'Time to step up your game!', color: 'orange' };
    return { icon: '🎯', text: 'Focus needed! Let\'s improve!', color: 'rose' };
  };

  const performanceTone = (status) => {
    const tones = { excellent: 'accent', good: 'primary', average: 'warning', poor: 'danger' };
    return tones[status] || 'primary';
  };

  const performanceBadgeVariant = (status) => {
    const variants = { excellent: 'success', good: 'primary', average: 'warning', poor: 'danger' };
    return variants[status] || 'neutral';
  };

  const getPerformanceIcon = (status) => {
    if (status === 'excellent') return <Sparkles className="text-accent" size={28} />;
    if (status === 'good') return <TrendingUp className="text-primary" size={28} />;
    if (status === 'average') return <Activity className="text-warning" size={28} />;
    return <CircleDot className="text-danger" size={28} />;
  };

  const taskLogColumns = [
    {
      key: 'done',
      header: '',
      width: '40px',
      render: (row) => (row.completed && row.active
        ? <CheckCircle size={18} className="text-accent" />
        : <Circle size={18} className="text-[var(--text-muted)]" />),
    },
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <span className={row.completed && row.active ? 'line-through text-[var(--text-muted)]' : !row.active ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text)]'}>
          {row.title}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => (!row.active
        ? <Badge variant="neutral">Inactive</Badge>
        : row.completed
          ? <Badge variant="success">Completed</Badge>
          : <Badge variant="warning">Pending</Badge>),
    },
    {
      key: 'time',
      header: 'Time',
      width: '110px',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Clock size={12} />
          {new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
          <Activity size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Performance Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">Analytics &amp; performance tracking</p>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Daily Summary */}
        <KpiCard
          label="Daily Summary"
          icon={<Calendar size={18} />}
          tone="primary"
          value={dailySummary ? dailySummary.total_todos : '—'}
          unit={dailySummary ? 'tasks today' : undefined}
          footer={
            dailySummary ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="success"><CheckCircle size={12} /> {dailySummary.completed_todos} completed</Badge>
                  <Badge variant="danger"><XCircle size={12} /> {dailySummary.failed_todos} failed</Badge>
                </div>
                <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={calculateDailySummary}>
                  Recalculate
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Calendar size={18} />}
                title="No metrics recorded today"
                action={<Button variant="primary" size="sm" onClick={calculateDailySummary}>Calculate Summary</Button>}
                className="py-3"
              />
            )
          }
        />

        {/* System Efficiency */}
        <KpiCard
          label="System Efficiency"
          icon={<TrendingUp size={18} />}
          tone={dailyPerformance ? performanceTone(dailyPerformance.performance_status) : 'primary'}
          value={dailyPerformance ? dailyPerformance.completion_percentage : '—'}
          unit={dailyPerformance ? '%' : undefined}
          progress={dailyPerformance ? parseFloat(dailyPerformance.completion_percentage) : undefined}
          footer={
            dailyPerformance ? (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant={performanceBadgeVariant(dailyPerformance.performance_status)}>
                  {getPerformanceIcon(dailyPerformance.performance_status)}
                  {dailyPerformance.performance_status}
                </Badge>
                <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={calculateDailySummary}>
                  Update
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Activity size={18} />}
                title="Efficiency not calculated"
                action={<Button variant="primary" size="sm" onClick={calculateDailySummary}>Compute Efficiency</Button>}
                className="py-3"
              />
            )
          }
        />

        {/* Daily Points */}
        <KpiCard
          label="Daily Points"
          icon={<Zap size={18} />}
          tone="warning"
          value={dailyPoints ? dailyPoints.points : '—'}
          unit={dailyPoints ? '/ 10' : undefined}
          footer={
            <div className="flex flex-col gap-2">
              {dailyPoints?.reason && (
                <p className="text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-lg px-3 py-2 border border-[var(--border)]">
                  {dailyPoints.reason}
                </p>
              )}
              <Input
                type="number"
                min="0"
                max="10"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder="Manual points (0-10)"
              />
              <Input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Reason (optional)"
              />
              <Button variant="primary" size="sm" onClick={updateDailyPoints}>
                Update Points
              </Button>
            </div>
          }
        />
      </div>

      {/* Long-term achievement progress, alongside the daily/cycle ToDo stats above */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <AchievementProgressKpi />
      </div>

      {/* Cycle Performance */}
      <Card>
        <CardHeader title="Cycle Performance" subtitle="Weekly and monthly aggregated points" icon={<Award size={16} />} />
        <Tabs
          tabs={[{ value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }]}
          value={cycleTab}
          onChange={setCycleTab}
          className="px-5"
        />
        <CardBody>
          {cycleTab === 'week' ? (
            weeklyPoints ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-end justify-center gap-2">
                  <span className="text-6xl font-light text-primary">{weeklyPoints.total_points}</span>
                  <span className="text-[var(--text-muted)] mb-2">/ 10</span>
                </div>
                {(() => {
                  const notification = getPerformanceNotification(weeklyPoints.total_points);
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                      <span className="text-2xl">{notification.icon}</span>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Cycle status</p>
                        <p className="text-sm font-medium text-[var(--text)]">{notification.text}</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(weeklyPoints.total_points / 10) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{new Date(weeklyPoints.week_start).toLocaleDateString()} – {new Date(weeklyPoints.week_end).toLocaleDateString()}</span>
                  <span className="text-primary font-medium">{((weeklyPoints.total_points / 10) * 100).toFixed(0)}%</span>
                </div>
                <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={calculateWeeklyPoints}>
                  Recalculate Week
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Award size={20} />}
                title="No weekly data yet"
                message="Calculate this week's points from completed tasks."
                action={<Button variant="primary" size="sm" onClick={calculateWeeklyPoints}>Compute Weekly Points</Button>}
              />
            )
          ) : (
            monthlyPoints ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-end justify-center gap-2">
                  <span className="text-6xl font-light text-primary">{monthlyPoints.total_points}</span>
                  <span className="text-[var(--text-muted)] mb-2">/ 10</span>
                </div>
                {(() => {
                  const notification = getPerformanceNotification(monthlyPoints.total_points);
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                      <span className="text-2xl">{notification.icon}</span>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Phase status</p>
                        <p className="text-sm font-medium text-[var(--text)]">{notification.text}</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(monthlyPoints.total_points / 10) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Month {monthlyPoints.month} · {monthlyPoints.year}</span>
                  <span className="text-primary font-medium">{((monthlyPoints.total_points / 10) * 100).toFixed(0)}%</span>
                </div>
                <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={calculateMonthlyPoints}>
                  Recalculate Month
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Trophy size={20} />}
                title="No monthly data yet"
                message="Calculate this month's points from completed tasks."
                action={<Button variant="primary" size="sm" onClick={calculateMonthlyPoints}>Compute Monthly Points</Button>}
              />
            )
          )}
        </CardBody>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader
          title="30-Day Completion Trend"
          subtitle="Daily completion percentage"
          icon={<BarChart3 size={16} />}
          action={
            performanceHistory.length > 0 ? (
              <span className="text-lg font-semibold text-accent">
                {performanceHistory[performanceHistory.length - 1]?.percentage.toFixed(1)}%
              </span>
            ) : null
          }
        />
        <CardBody>
          {performanceHistory.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,247,250,0.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(245,247,250,0.12)"
                    tick={{ fill: '#8b95a5', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(245,247,250,0.12)' }}
                  />
                  <YAxis
                    stroke="rgba(245,247,250,0.12)"
                    tick={{ fill: '#8b95a5', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(245,247,250,0.12)' }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1117',
                      border: '1px solid rgba(245,247,250,0.12)',
                      borderRadius: '10px',
                      color: '#f5f7fa'
                    }}
                    itemStyle={{ color: '#10b981', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPerf)"
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 size={20} />}
              title="Not enough data yet"
              message="Complete objectives over a few days to see your trend."
            />
          )}
        </CardBody>
      </Card>

      {/* Task Log */}
      <Card>
        <CardHeader title="Task Log" subtitle="Browse tasks logged on a specific date" icon={<Target size={16} />} />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">Select a date to inspect its task history</p>
            <DateField
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="sm:w-52"
            />
          </div>

          {todos.length === 0 ? (
            <EmptyState
              icon={<Target size={20} />}
              title="No tasks found"
              message="No objectives were logged on this date."
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="text-center">
                  <div className="text-xl font-semibold text-[var(--text)]">{todos.length}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Total</div>
                </div>
                <div className="text-center border-x border-[var(--border)]">
                  <div className="text-xl font-semibold text-accent">{todos.filter(t => t.completed && t.active).length}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-danger">{todos.filter(t => !t.completed && t.active).length}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Pending</div>
                </div>
              </div>

              <Table columns={taskLogColumns} data={todos} rowKey={(row) => row.id} />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
