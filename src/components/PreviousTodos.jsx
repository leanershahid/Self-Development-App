import React, { useState, useEffect } from 'react';
import { Check, Trash2, Edit2, X, Calendar, ChevronDown, ChevronUp, TrendingUp, Clock, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './NavBar';

const supabaseUrl = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PreviousTodos() {
  const [todosByDate, setTodosByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [expandedDates, setExpandedDates] = useState({});
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatingDate, setRecalculatingDate] = useState(null);

  useEffect(() => {
    loadPreviousTodos();
  }, []);

  const loadPreviousTodos = async () => {
    setLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ToDo')
        .select('*')
        .eq('active', true)
        .lt('created_at', `${todayStr}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group todos by date
      const grouped = {};
      data.forEach(todo => {
        const dateKey = todo.created_at.split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(todo);
      });

      setTodosByDate(grouped);

      // Auto-expand the most recent date
      const dates = Object.keys(grouped);
      if (dates.length > 0) {
        setExpandedDates({ [dates[0]]: true });
      }
    } catch (error) {
      console.error("Error loading previous todos:", error);
    }

    setLoading(false);
  };

  const recalculateAllPreviousDates = async () => {
    if (!confirm('This will recalculate performance data for all previous dates. This may take a while. Continue?')) {
      return;
    }

    setRecalculating(true);

    try {
      const dates = Object.keys(todosByDate).sort((a, b) => a.localeCompare(b));

      let processed = 0;
      let failed = 0;

      // Process each date
      for (const dateStr of dates) {
        try {
          setRecalculatingDate(dateStr);
          await recalculateSpecificDate(dateStr);
          processed++;

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Failed to recalculate ${dateStr}:`, err);
          failed++;
        }
      }

      alert(`✅ Bulk Recalculation Complete!\n\nProcessed: ${processed} days\nFailed: ${failed} days`);
    } catch (error) {
      console.error("Error in bulk recalculation:", error);
      alert('Failed to recalculate all data: ' + error.message);
    }

    setRecalculating(false);
    setRecalculatingDate(null);
  };

  const handleToggle = async (id, currentCompleted) => {
    try {
      const { error } = await supabase
        .from('ToDo')
        .update({ completed: !currentCompleted })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedTodosByDate = { ...todosByDate };
      Object.keys(updatedTodosByDate).forEach(date => {
        updatedTodosByDate[date] = updatedTodosByDate[date].map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        );
      });
      setTodosByDate(updatedTodosByDate);
    } catch (error) {
      console.error("Error toggling todo:", error);
      alert("Failed to update todo. Please try again.");
    }
  };

  const handleDelete = async (id, dateKey) => {
    try {
      const { error } = await supabase
        .from('ToDo')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedTodosByDate = { ...todosByDate };
      updatedTodosByDate[dateKey] = updatedTodosByDate[dateKey].filter(t => t.id !== id);

      // Remove date group if empty
      if (updatedTodosByDate[dateKey].length === 0) {
        delete updatedTodosByDate[dateKey];
      }

      setTodosByDate(updatedTodosByDate);
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("Failed to delete todo. Please try again.");
    }
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleEdit = async (id, dateKey) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('ToDo')
        .update({ title: editText.trim() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedTodosByDate = { ...todosByDate };
      updatedTodosByDate[dateKey] = updatedTodosByDate[dateKey].map(t =>
        t.id === id ? { ...t, title: editText.trim() } : t
      );
      setTodosByDate(updatedTodosByDate);
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error("Error editing todo:", error);
      alert("Failed to edit todo. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const toggleDateExpansion = (dateKey) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const recalculateSpecificDate = async (dateStr) => {
    setRecalculating(true);
    setRecalculatingDate(dateStr);

    try {
      const { data: todos, error } = await supabase
        .from('ToDo')
        .select('*')
        .gte('created_at', dateStr + 'T00:00:00')
        .lte('created_at', dateStr + 'T23:59:59');

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

      // Update or insert daily_todo_summary
      const { data: existingSummary } = await supabase
        .from('daily_todo_summary')
        .select('*')
        .eq('day', dateStr)
        .maybeSingle();

      if (existingSummary) {
        await supabase
          .from('daily_todo_summary')
          .update({
            total_todos: total,
            completed_todos: completed,
            failed_todos: failed
          })
          .eq('day', dateStr);
      } else {
        await supabase
          .from('daily_todo_summary')
          .insert({
            day: dateStr,
            total_todos: total,
            completed_todos: completed,
            failed_todos: failed
          });
      }

      // Update or insert daily_performance
      const { data: existingPerf } = await supabase
        .from('daily_performance')
        .select('*')
        .eq('day', dateStr)
        .maybeSingle();

      if (existingPerf) {
        await supabase
          .from('daily_performance')
          .update({
            completion_percentage: percentage.toFixed(2),
            performance_status: status
          })
          .eq('day', dateStr);
      } else {
        await supabase
          .from('daily_performance')
          .insert({
            day: dateStr,
            completion_percentage: percentage.toFixed(2),
            performance_status: status
          });
      }

      // Update or insert daily_points
      const { data: existingPoints } = await supabase
        .from('daily_points')
        .select('*')
        .eq('day', dateStr)
        .maybeSingle();

      if (existingPoints) {
        await supabase
          .from('daily_points')
          .update({
            points: autoPoints,
            reason: `Auto-recalculated: ${completed}/${total} tasks completed (${percentage.toFixed(0)}%)`
          })
          .eq('day', dateStr);
      } else {
        await supabase
          .from('daily_points')
          .insert({
            day: dateStr,
            points: autoPoints,
            reason: `Auto-calculated: ${completed}/${total} tasks completed (${percentage.toFixed(0)}%)`
          });
      }

      alert(`✅ Performance recalculated!\n\nDate: ${new Date(dateStr).toLocaleDateString()}\nScore: ${autoPoints}/10\nCompleted: ${completed}/${total} tasks (${percentage.toFixed(0)}%)\nStatus: ${status.toUpperCase()}`);
    } catch (error) {
      console.error("Error recalculating date:", error);
      alert('Failed to recalculate: ' + error.message);
    }

    setRecalculating(false);
    setRecalculatingDate(null);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === yesterdayOnly) return 'Yesterday';

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDateStats = (todos) => {
    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const dates = Object.keys(todosByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
      <Navbar />

      <style>{`
        @keyframes slide-in {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
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
          background: linear-gradient(to right, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.8));
          color: white;
          border: 1px solid rgba(99, 102, 241, 0.5);
          transition: all 0.3s ease;
        }
        
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(99, 102, 241, 1), rgba(168, 85, 247, 1));
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="dash-glass rounded-3xl p-6 mb-6 slide-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-gray-900/50">
                <Clock size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tight">
                  Archive Logs
                </h1>
                <p className="text-indigo-400/60 font-mono text-xs sm:text-sm tracking-widest uppercase mt-1">
                  Historical Operation Data
                </p>
              </div>
            </div>

            {/* Bulk Recalculate Button */}
            {Object.keys(todosByDate).length > 0 && (
              <button
                onClick={recalculateAllPreviousDates}
                disabled={recalculating}
                className="w-full sm:w-auto dash-btn px-5 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
              >
                {recalculating ? (
                  <>
                    <RefreshCw className="animate-spin text-white" size={16} />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="text-white" />
                    <span>Sync All Telemetry</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        {Object.keys(todosByDate).length > 0 && (
          <div className="dash-glass rounded-2xl p-5 mb-8 border border-indigo-500/20 slide-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex-shrink-0">
                <Sparkles className="text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200 mb-1 flex items-center gap-2">
                  Telemetry Synchronization
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">Admin Notice</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Following entity modification, initialize <RefreshCw className="inline w-3 h-3 mx-1 text-indigo-400" /> on targeted dates to sync metrics. Use <strong>Sync All Telemetry</strong> to run a global batch process updating all historical values in the Performance Dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="dash-glass rounded-3xl p-16 text-center slide-in mt-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              <div className="text-indigo-400 font-mono text-xs tracking-widest uppercase animate-pulse">Decrypting Logs...</div>
            </div>
          </div>
        ) : dates.length === 0 ? (
          <div className="dash-glass rounded-3xl p-16 text-center slide-in mt-8 border border-white/5">
            <div className="w-20 h-20 bg-gray-900/50 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 float-animation shadow-inner">
              <Calendar className="text-gray-500" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Archive Empty</h3>
            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-4 max-w-sm mx-auto">
              No historical data available. Active operations will log here post-cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((dateKey, index) => {
              const todos = todosByDate[dateKey];
              const stats = getDateStats(todos);
              const isExpanded = expandedDates[dateKey];

              return (
                <div key={dateKey} className="dash-glass rounded-3xl overflow-hidden slide-in border hover:border-indigo-500/30 transition-colors duration-500" style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDateExpansion(dateKey)}
                    className="w-full px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-all group gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center shadow-lg group-hover:bg-indigo-500/20 transition-colors">
                        <Calendar className="text-indigo-400 group-hover:text-indigo-300 transition-colors" size={20} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-200 group-hover:text-indigo-300 transition-colors">
                          {formatDate(dateKey)}
                        </h3>
                        <p className="text-xs font-mono text-gray-500 mt-0.5 tracking-wide">
                          Yield: <span className="text-gray-400">{stats.completed}/{stats.total}</span> <span className="text-indigo-500/50 px-1">•</span> <span className="text-indigo-400">{stats.percentage}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {/* Recalculate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          recalculateSpecificDate(dateKey);
                        }}
                        disabled={recalculating && recalculatingDate === dateKey}
                        className="p-2.5 dash-btn rounded-xl text-white transition-all transform hover:scale-110 shadow-[0_0_10px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync Telemetry"
                      >
                        <RefreshCw
                          size={16}
                          className={recalculating && recalculatingDate === dateKey ? 'animate-spin' : ''}
                        />
                      </button>

                      {/* Mini Progress Ring */}
                      <div className="relative w-12 h-12 drop-shadow-[0_0_5px_rgba(99,102,241,0.2)]">
                        <svg className="transform -rotate-90 w-12 h-12">
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-gray-800"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="url(#gradientDark-${dateKey})"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 18}`}
                            strokeDashoffset={`${2 * Math.PI * 18 * (1 - stats.percentage / 100)}`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id={`gradientDark-${dateKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#c084fc" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-indigo-300">{stats.percentage}</span>
                        </div>
                      </div>

                      <div className="p-1 bg-gray-900/50 rounded-lg border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="text-indigo-400" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-500 group-hover:text-indigo-400" size={20} />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Tasks List */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 space-y-3 border-t border-white/5 bg-gray-900/40">
                      {todos.map((todo, todoIndex) => (
                        <div key={todo.id} className="slide-in" style={{ animationDelay: `${todoIndex * 0.05}s` }}>
                          {editingId === todo.id ? (
                            <div className="flex flex-col sm:flex-row items-center gap-3 py-3 px-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl mt-2 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0"></div>
                              <input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full sm:flex-1 px-4 py-2.5 dash-input rounded-xl text-sm focus:border-indigo-500 relative z-10"
                                autoFocus
                              />
                              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 relative z-10">
                                <button
                                  onClick={() => handleEdit(todo.id, dateKey)}
                                  className="flex-1 sm:flex-none p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-emerald-400 transition-all flex justify-center items-center"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex-1 sm:flex-none p-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl text-rose-400 transition-all flex justify-center items-center"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="group flex flex-row items-center gap-3 py-3 px-4 bg-gray-900/60 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all mt-2 overflow-hidden hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                              <button
                                onClick={() => handleToggle(todo.id, todo.completed)}
                                className={`relative flex-shrink-0 w-6 h-6 rounded border transition-all ${todo.completed
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                    : 'bg-gray-800 border-gray-600 hover:border-indigo-400'
                                  }`}
                              >
                                {todo.completed && (
                                  <Check size={14} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={3} />
                                )}
                              </button>

                              <span className={`flex-1 text-sm transition-all sm:truncate ${todo.completed
                                  ? 'line-through text-gray-600'
                                  : 'text-gray-300 font-medium group-hover:text-indigo-200'
                                }`}>
                                {todo.title}
                              </span>

                              <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-start sm:self-auto shrink-0">
                                <button
                                  onClick={() => startEdit(todo.id, todo.title)}
                                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/30 border border-transparent hover:border-indigo-500/30 rounded-lg text-indigo-400 transition-all"
                                  title="Configure"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(todo.id, dateKey)}
                                  className="p-2 bg-rose-500/10 hover:bg-rose-500/30 border border-transparent hover:border-rose-500/30 rounded-lg text-rose-400 transition-all"
                                  title="Eradicate"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}