import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, Award, Target, CheckCircle, XCircle, BarChart3, Sparkles, Zap, Activity, CircleDot, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './NavBar';

const supabaseUrl = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PerformanceDashboard() {
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
  const [weeklyScores, setWeeklyScores] = useState([]);

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
      const { data: firstTask, error: firstTaskError } = await supabase
        .from('ToDo')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstTaskError || !firstTask) {
        alert('No tasks found to calculate from');
        return;
      }

      const firstTaskDate = new Date(firstTask.created_at);
      const today = new Date();

      const daysSinceStart = Math.floor((today - firstTaskDate) / (1000 * 60 * 60 * 24));
      const currentWeekNumber = Math.floor(daysSinceStart / 7);

      const weekStart = new Date(firstTaskDate);
      weekStart.setDate(firstTaskDate.getDate() + (currentWeekNumber * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const { data: todos, error: todosError } = await supabase
        .from('ToDo')
        .select('*')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (todosError) throw todosError;

      const totalTasks = todos.length;
      const completedTasks = todos.filter(t => t.completed && t.active).length;

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
      alert(`Weekly points calculated!\nScore: ${weekScore}/10\nCompleted: ${completedTasks}/${totalTasks} tasks (${(completionRate * 100).toFixed(0)}%)`);
    } catch (error) {
      console.error("Error calculating weekly points:", error);
      alert('Failed to calculate weekly points: ' + error.message);
    }
  };

  const calculateMonthlyPoints = async () => {
    try {
      const { data: firstTask, error: firstTaskError } = await supabase
        .from('ToDo')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstTaskError || !firstTask) {
        alert('No tasks found to calculate from');
        return;
      }

      const firstTaskDate = new Date(firstTask.created_at);
      const today = new Date();

      const daysSinceStart = Math.floor((today - firstTaskDate) / (1000 * 60 * 60 * 24));
      const currentMonthNumber = Math.floor(daysSinceStart / 30);

      const monthStart = new Date(firstTaskDate);
      monthStart.setDate(firstTaskDate.getDate() + (currentMonthNumber * 30));
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setDate(monthStart.getDate() + 29);
      monthEnd.setHours(23, 59, 59, 999);

      const { data: todos, error: todosError } = await supabase
        .from('ToDo')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (todosError) throw todosError;

      const totalTasks = todos.length;
      const completedTasks = todos.filter(t => t.completed && t.active).length;

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
      const monthScore = Math.round(completionRate * 10);

      const { data: existing } = await supabase
        .from('monthly_points')
        .select('*')
        .eq('month', currentMonthNumber + 1)
        .eq('year', firstTaskDate.getFullYear())
        .maybeSingle();

      let result;
      if (existing) {
        const { data } = await supabase
          .from('monthly_points')
          .update({
            total_points: monthScore
          })
          .eq('month', currentMonthNumber + 1)
          .eq('year', firstTaskDate.getFullYear())
          .select()
          .single();
        result = data;
      } else {
        const { data } = await supabase
          .from('monthly_points')
          .insert({
            month: currentMonthNumber + 1,
            year: firstTaskDate.getFullYear(),
            total_points: monthScore
          })
          .select()
          .single();
        result = data;
      }

      setMonthlyPoints(result);
      await loadPerformanceHistory();
      await loadWeeklyScores();
      alert(`Monthly points calculated!\nScore: ${monthScore}/10\nCompleted: ${completedTasks}/${totalTasks} tasks (${(completionRate * 100).toFixed(0)}%)`);
    } catch (error) {
      console.error("Error calculating monthly points:", error);
      alert('Failed to calculate monthly points: ' + error.message);
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
      const { data: firstTask } = await supabase.from('ToDo').select('created_at').order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (!firstTask) { setWeeklyScores([]); return; }
      const firstTaskDate = new Date(firstTask.created_at);
      firstTaskDate.setHours(0, 0, 0, 0);
      const weekMap = new Map();
      (data || []).forEach(item => {
        const itemDate = new Date(item.day);
        itemDate.setHours(0, 0, 0, 0);
        const daysSinceFirst = Math.floor((itemDate - firstTaskDate) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysSinceFirst / 7);
        const weekStart = new Date(firstTaskDate);
        weekStart.setDate(firstTaskDate.getDate() + (weekNumber * 7));
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekKey)) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekMap.set(weekKey, { weekStart: weekStart, weekEnd: weekEnd, totalScore: 0, days: 0 });
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
    if (isNaN(points) || points < 0 || points > 10) { alert('Points must be between 0 and 10'); return; }
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
      alert('Daily points updated successfully!');
    } catch (error) {
      console.error("Error updating points:", error);
      alert('Failed to update points: ' + error.message);
    }
  };

  const calculateDailySummary = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: todos, error } = await supabase.from('ToDo').select('*').gte('created_at', today + 'T00:00:00').lte('created_at', today + 'T23:59:59');
      if (error) throw error;
      const total = todos.length;
      const completed = todos.filter(t => t.completed && t.active).length;
      const failed = todos.filter(t => !t.completed && t.active).length;
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
      alert('Daily summary recalculated successfully!');
    } catch (error) {
      console.error("Error calculating summary:", error);
      alert('Failed to calculate summary: ' + error.message);
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

  const getPerformanceColor = (status) => {
    const colors = {
      excellent: 'emerald',
      good: 'sky',
      average: 'amber',
      poor: 'rose'
    };
    return colors[status] || 'slate';
  };

  const getPerformanceIcon = (status) => {
    if (status === 'excellent') return <Sparkles className="text-emerald-400" size={32} />;
    if (status === 'good') return <TrendingUp className="text-sky-400" size={32} />;
    if (status === 'average') return <Activity className="text-amber-400" size={32} />;
    return <CircleDot className="text-rose-400" size={32} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          <div className="text-indigo-400 font-mono text-sm tracking-widest uppercase animate-pulse">Computing Metrics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
      <Navbar />
      <style>{`
        .dash-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .dash-input {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #3D52A0;
          transition: all 0.3s ease;
        }
        .dash-input:focus {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
          outline: none;
        }
        .dash-btn {
          background: linear-gradient(to right, rgba(79, 70, 229, 0.8), rgba(99, 102, 241, 0.8));
          color: white;
          border: 1px solid rgba(99, 102, 241, 0.5);
          transition: all 0.3s ease;
        }
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(79, 70, 229, 1), rgba(99, 102, 241, 1));
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }
      `}</style>

      <div className="max-w-7xl mx-auto py-6 px-3 sm:px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Activity size={32} strokeWidth={2} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
          </h1>
          <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase">
            Systems Analytics & Performance Tracking
          </p>
        </div>

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">

          {/* Today's Summary */}
          <div className="dash-glass rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0 opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-200">Daily Summary</h3>
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <Calendar className="text-cyan-400" size={20} />
              </div>
            </div>

            {dailySummary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-white/5">
                  <span className="text-gray-400 font-mono text-xs tracking-wider uppercase">Total Tasks</span>
                  <span className="text-2xl font-bold text-gray-200">{dailySummary.total_todos}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/20">
                  <span className="text-emerald-400/80 font-mono text-xs tracking-wider uppercase flex items-center gap-2">
                    <CheckCircle size={14} /> Completed
                  </span>
                  <span className="text-2xl font-bold text-emerald-400">{dailySummary.completed_todos}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-rose-900/20 rounded-xl border border-rose-500/20">
                  <span className="text-rose-400/80 font-mono text-xs tracking-wider uppercase flex items-center gap-2">
                    <XCircle size={14} /> Failed
                  </span>
                  <span className="text-2xl font-bold text-rose-400">{dailySummary.failed_todos}</span>
                </div>
                <button onClick={calculateDailySummary} className="w-full mt-2 px-5 py-3 dash-btn rounded-xl font-semibold text-sm tracking-wide uppercase">
                  Recalculate Data
                </button>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-900/30 rounded-2xl border border-white/5">
                <Calendar className="text-gray-600 mx-auto mb-3" size={32} />
                <p className="text-gray-500 text-sm mb-4">No metrics recorded today</p>
                <button onClick={calculateDailySummary} className="px-6 py-2 dash-btn rounded-xl text-sm font-semibold tracking-wide uppercase">
                  Initialize Scan
                </button>
              </div>
            )}
          </div>

          {/* Performance Status */}
          <div className="dash-glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500 to-fuchsia-500/0 opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-200">System Efficiency</h3>
              <div className="p-2.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl">
                <TrendingUp className="text-fuchsia-400" size={20} />
              </div>
            </div>

            {dailyPerformance ? (
              <div className="flex flex-col h-[calc(100%-4rem)]">
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className={`mb-4 inline-flex p-4 rounded-2xl bg-${getPerformanceColor(dailyPerformance.performance_status)}-500/10 border border-${getPerformanceColor(dailyPerformance.performance_status)}-500/30 shadow-[0_0_20px_rgba(var(--tw-colors-${getPerformanceColor(dailyPerformance.performance_status)}-500),0.2)]`}>
                    {getPerformanceIcon(dailyPerformance.performance_status)}
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <div className="text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      {dailyPerformance.completion_percentage}
                    </div>
                    <span className="text-2xl text-cyan-400/60">%</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-${getPerformanceColor(dailyPerformance.performance_status)}-400 bg-${getPerformanceColor(dailyPerformance.performance_status)}-500/10 border border-${getPerformanceColor(dailyPerformance.performance_status)}-500/20 text-[10px] font-bold uppercase tracking-widest`}>
                    Status: {dailyPerformance.performance_status}
                  </div>
                </div>
                <button onClick={calculateDailySummary} className="w-full mt-4 px-5 py-3 dash-btn rounded-xl font-semibold text-sm tracking-wide uppercase">
                  Update Matrix
                </button>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-900/30 rounded-2xl border border-white/5">
                <Activity className="text-gray-600 mx-auto mb-3" size={32} />
                <p className="text-gray-500 text-sm mb-4">Efficiency matrix offline</p>
                <button onClick={calculateDailySummary} className="px-6 py-2 dash-btn rounded-xl text-sm font-semibold tracking-wide uppercase">
                  Compute Efficiency
                </button>
              </div>
            )}
          </div>

          {/* Today's Points */}
          <div className="dash-glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-50"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-200">Energy Credits</h3>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Zap className="text-amber-400" size={20} />
              </div>
            </div>

            <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
              {dailyPoints ? (
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      {dailyPoints.points}
                    </div>
                    <div className="text-sm font-mono text-gray-500">/ 10 CR</div>
                  </div>
                  {dailyPoints.reason && (
                    <p className="text-[10px] text-gray-400 font-mono tracking-wide px-3 py-2 bg-gray-900/50 rounded-lg border border-white/5 inline-block">
                      {dailyPoints.reason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center mb-4 py-4 bg-gray-900/30 rounded-xl border border-white/5">
                  <Zap className="mx-auto mb-2 text-gray-600" size={28} />
                  <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">No Credits Generated</p>
                </div>
              )}

              <div className="space-y-2 mt-auto">
                <input type="number" min="0" max="10" value={pointsInput} onChange={(e) => setPointsInput(e.target.value)} placeholder="Manual Credits (0-10)" className="w-full px-4 py-2.5 dash-input rounded-xl text-sm" />
                <input type="text" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} placeholder="Override Auth Reason" className="w-full px-4 py-2.5 dash-input rounded-xl text-sm" />
                <button onClick={updateDailyPoints} className="w-full px-5 py-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 border border-amber-500/30 rounded-xl transition-all font-semibold text-xs tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  Override Credits
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* This Week */}
          <div className="dash-glass rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-200 mb-1">Weekly Cycle</h3>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Aggregated Credits</p>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <Award className="text-indigo-400" size={24} />
              </div>
            </div>

            {weeklyPoints ? (
              <div className="relative z-10">
                <div className="flex items-end justify-center gap-2 mb-6">
                  <div className="text-7xl font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {weeklyPoints.total_points}
                  </div>
                  <div className="text-gray-600 font-mono mb-2">/ 10</div>
                </div>

                {(() => {
                  const notification = getPerformanceNotification(weeklyPoints.total_points);
                  return (
                    <div className="mb-6 p-4 bg-gray-900/50 border border-white/5 rounded-xl flex items-center gap-4">
                      <span className="text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{notification.icon}</span>
                      <div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Cycle Status</div>
                        <div className="text-sm font-medium text-gray-300">{notification.text}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="w-full bg-gray-900 rounded-full h-1.5 mb-6 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 relative"
                    style={{ width: `${(weeklyPoints.total_points / 10) * 100}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-6">
                  <span>{new Date(weeklyPoints.week_start).toLocaleDateString()} - {new Date(weeklyPoints.week_end).toLocaleDateString()}</span>
                  <span className="text-indigo-400">{((weeklyPoints.total_points / 10) * 100).toFixed(0)}% Yield</span>
                </div>

                <button onClick={calculateWeeklyPoints} className="w-full dash-btn py-3 rounded-xl font-semibold text-xs tracking-widest uppercase">
                  Recalculate Cycle
                </button>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-white/5">
                <Award className="text-gray-600 mx-auto mb-3" size={36} />
                <p className="text-gray-500 text-sm mb-4">No cycle data found</p>
                <button onClick={calculateWeeklyPoints} className="px-6 py-2 dash-btn rounded-xl text-xs font-semibold tracking-widest uppercase">
                  Compute Cycle
                </button>
              </div>
            )}
          </div>

          {/* This Month */}
          <div className="dash-glass rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-200 mb-1">Monthly Phase</h3>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Macro Aggregation</p>
              </div>
              <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl">
                <Trophy className="text-fuchsia-400" size={24} />
              </div>
            </div>

            {monthlyPoints ? (
              <div className="relative z-10">
                <div className="flex items-end justify-center gap-2 mb-6">
                  <div className="text-7xl font-light text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400">
                    {monthlyPoints.total_points}
                  </div>
                  <div className="text-gray-600 font-mono mb-2">/ 10</div>
                </div>

                {(() => {
                  const notification = getPerformanceNotification(monthlyPoints.total_points);
                  return (
                    <div className="mb-6 p-4 bg-gray-900/50 border border-white/5 rounded-xl flex items-center gap-4">
                      <span className="text-2xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{notification.icon}</span>
                      <div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Phase Status</div>
                        <div className="text-sm font-medium text-gray-300">{notification.text}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="w-full bg-gray-900 rounded-full h-1.5 mb-6 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-rose-400 relative"
                    style={{ width: `${(monthlyPoints.total_points / 10) * 100}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-6">
                  <span>Phase {monthlyPoints.month} • Y{monthlyPoints.year}</span>
                  <span className="text-fuchsia-400">{((monthlyPoints.total_points / 10) * 100).toFixed(0)}% Yield</span>
                </div>

                <button onClick={calculateMonthlyPoints} className="w-full bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-600/40 py-3 rounded-xl font-semibold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(217,70,239,0.1)]">
                  Recalculate Phase
                </button>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-white/5">
                <Trophy className="text-gray-600 mx-auto mb-3" size={36} />
                <p className="text-gray-500 text-sm mb-4">No phase data found</p>
                <button onClick={calculateMonthlyPoints} className="px-6 py-2 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-xl text-xs font-semibold tracking-widest uppercase">
                  Compute Phase
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="dash-glass rounded-3xl p-8 mb-8 relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-200 mb-1">Telemetry Graph</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">30-Day Efficiency Plot</p>
            </div>
            <div className="flex items-center gap-4">
              {performanceHistory.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-light text-cyan-400 font-mono">
                    {performanceHistory[performanceHistory.length - 1]?.percentage.toFixed(1)}<span className="text-sm">%</span>
                  </div>
                </div>
              )}
              <div className="p-2 bg-gray-800 border border-white/10 rounded-lg">
                <BarChart3 className="text-cyan-500" size={20} />
              </div>
            </div>
          </div>

          {performanceHistory.length > 0 ? (
            <div className="h-80 w-full bg-gray-900/50 rounded-2xl p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#1e293b' }}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#1e293b' }}
                    axisLine={{ stroke: '#1e293b' }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.72)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '12px',
                      color: '#3D52A0',
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
                    }}
                    itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCyan)"
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: '#EDE8F5', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-white/5">
              <BarChart3 className="text-gray-700 mx-auto mb-4" size={40} />
              <p className="text-gray-500 font-mono text-sm tracking-widest uppercase mb-1">Insufficient Data</p>
              <p className="text-xs text-gray-600">Complete objectives to generate telemetry</p>
            </div>
          )}
        </div>

        {/* Task Log Inspector */}
        <div className="dash-glass rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-200 mb-1">System Log Inspector</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Query historical task data</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="dash-input px-4 py-2 rounded-xl text-sm w-full md:w-auto"
              />
            </div>
          </div>

          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-white/5">
                <Target className="text-gray-700 mx-auto mb-4" size={40} />
                <p className="text-gray-500 font-mono text-sm tracking-widest uppercase mb-1">No logs found</p>
                <p className="text-xs text-gray-600">No objectives were initialized on this cycle</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                  <div className="text-center">
                    <div className="text-2xl font-light text-cyan-400">{todos.length}</div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Found</div>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <div className="text-2xl font-light text-emerald-400">{todos.filter(t => t.completed && t.active).length}</div>
                    <div className="text-[10px] text-emerald-600/70 font-mono tracking-widest uppercase mt-1">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-rose-400">{todos.filter(t => !t.completed && t.active).length}</div>
                    <div className="text-[10px] text-rose-600/70 font-mono tracking-widest uppercase mt-1">Failed</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div key={todo.id} className={`flex flex-wrap md:flex-nowrap items-center gap-4 p-4 rounded-xl border ${todo.active ? 'bg-gray-800/40 border-white/5 hover:bg-gray-800' : 'bg-gray-900/30 border-transparent opacity-50'}`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center ${todo.completed && todo.active
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : todo.active
                            ? 'border-gray-600 bg-transparent'
                            : 'border-gray-800 bg-gray-900 text-gray-700'
                        }`}>
                        {todo.completed && <Check size={14} />}
                      </div>

                      <span className={`flex-1 text-sm ${todo.completed && todo.active ? 'line-through text-gray-500' : todo.active ? 'text-gray-300' : 'text-gray-600 line-through'
                        }`}>
                        {todo.title}
                      </span>

                      <div className="flex items-center gap-3 ml-auto mt-2 md:mt-0">
                        {todo.active ? (
                          todo.completed ? (
                            <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-[10px] font-mono uppercase tracking-wider">Executed</span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[10px] font-mono uppercase tracking-wider">Pending</span>
                          )
                        ) : (
                          <span className="px-2 py-1 bg-gray-800 border border-gray-700 text-gray-500 rounded text-[10px] font-mono uppercase tracking-wider">Terminated</span>
                        )}
                        <span className="text-[10px] font-mono text-cyan-700">
                          {new Date(todo.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}