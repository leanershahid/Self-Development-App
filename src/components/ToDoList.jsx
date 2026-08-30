import React, { useState, useEffect } from 'react';
import { Check, Trash2, Edit2, Plus, X, RefreshCw, Camera, Clock, Sparkles, TrendingUp, Flame, AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Navbar from './NavBar';
import TodaysQuotes from './TodaysQuotes';
import CloudinaryUpload from './CloudinaryUpload';
import { useTodoReminder } from '../utils/useTodoReminder';

const supabaseUrl = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TodoList() {
  const navigate = useNavigate();
  const [todos, setTodos]           = useState([]);
  const [newTodo, setNewTodo]       = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueTime, setNewDueTime] = useState('');
  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '/MyImage01.JPG');
  const [lastRegenerate, setLastRegenerate] = useState(localStorage.getItem('lastRegenerate') || null);
  const [imageUrl, setImageUrl]     = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const [xpPopup, setXpPopup]       = useState(null); // { id, xp }
  const [streak, setStreak]         = useState(() => parseInt(localStorage.getItem('todo_streak') || '0'));
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [txLoading, setTxLoading]   = useState(false);

  const defaultTodos = [
  "Gym",
  "Keep Diet Correctly",
  "Read a Book",
  "Learn Ai Tools",
  "Being a Better Person"
  ];

  useEffect(() => {
    loadTodos();
    loadTodayTransactions();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayTransactions = async () => {
    setTxLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('money_transactions')
        .select('*')
        .eq('date', todayStr)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTodayTransactions(data || []);
    } catch (error) {
      console.error("Error loading today's transactions:", error);
    }
    setTxLoading(false);
  };

  const formatDateTime = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = months[currentTime.getMonth()];

    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return {
      dayStr: day,
      dateStr: `${date} ${month}`,
      timeStr: `${hours}:${minutes}`,
      secondsStr: seconds,
      ampm
    };
  };

  const { dayStr, dateStr, timeStr, secondsStr, ampm } = formatDateTime();

  const loadTodos = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ToDo')
        .select('*')
        .eq('active', true)
        .gte('created_at', `${todayStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error("Error loading todos:", error);
    }
    setLoading(false);
  };

  const handleAddTodo = async () => {
    const trimmedTodo = newTodo.trim();
    if (!trimmedTodo) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const duplicate = todos.some(
      t => t.title === trimmedTodo && t.active && t.created_at.startsWith(todayStr)
    );

    if (duplicate) {
      alert("This task already exists today!");
      return;
    }

    setAddingTodo(true);
    try {
      const { data, error } = await supabase
        .from('ToDo')
        .insert([{ title: trimmedTodo, completed: false, active: true, priority: newPriority, due_time: newDueTime || null }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setTodos([data[0], ...todos]);
        setNewTodo('');
        setNewDueTime('');
        setNewPriority('medium');
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      alert("Failed to add todo. Please try again.");
    }
    setTimeout(() => setAddingTodo(false), 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddTodo();
  };

  const handleToggle = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    try {
      const { error } = await supabase.from('ToDo').update({ completed: !todo.completed }).eq('id', id);
      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      if (!todo.completed) {
        const xp = todo.priority === 'high' ? 30 : todo.priority === 'low' ? 10 : 20;
        setXpPopup({ id, xp });
        setTimeout(() => setXpPopup(null), 1500);
        // streak
        const lastDate = localStorage.getItem('todo_streak_date');
        const today = new Date().toISOString().split('T')[0];
        if (lastDate !== today) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('todo_streak', newStreak);
          localStorage.setItem('todo_streak_date', today);
        }
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      alert("Failed to update todo. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('ToDo').update({ active: false }).eq('id', id);
      if (error) throw error;
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("Failed to delete todo. Please try again.");
    }
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const { error } = await supabase.from('ToDo').update({ title: editText.trim() }).eq('id', id);
      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, title: editText.trim() } : t));
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setProfileImage(imageUrl.trim());
      localStorage.setItem('profileImage', imageUrl.trim());
      setImageUrl('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem('profileImage');
  };

  const handleRegenerate = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: existingTodos, error: fetchError } = await supabase
        .from('ToDo')
        .select('title')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`)
        .eq('active', true);

      if (fetchError) throw fetchError;

      const existingTitles = existingTodos.map(t => t.title);
      const newTodosData = defaultTodos
        .filter(title => !existingTitles.includes(title))
        .map(title => ({ title, completed: false, active: true }));

      if (newTodosData.length === 0) {
        alert('All default tasks already exist today!');
        return;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('ToDo')
        .insert(newTodosData)
        .select();

      if (insertError) throw insertError;

      setTodos(prev => [...insertedData, ...prev]);
    } catch (error) {
      console.error('Error regenerating todos:', error);
      alert('Failed to regenerate todos. Please try again.');
    }
  };

  useTodoReminder(todos);

  const completedCount = todos.filter(t => t.completed).length;
  const canRegenerate = lastRegenerate !== new Date().toDateString();
  const completionPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = todayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-[#060913] text-gray-200">
      <Navbar />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.2); }
          50% { box-shadow: 0 0 40px rgba(124, 58, 237, 0.6); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-glowPulse {
          animation: glowPulse 3s ease-in-out infinite;
        }
        .animate-slideIn {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bg-gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }
        
        .dark-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .neon-border {
          position: relative;
        }
        .neon-border::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(45deg, rgba(124,58,237,0.5), rgba(56,189,248,0.5), rgba(124,58,237,0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        
        .futuristic-input:focus ~ .input-highlight {
          width: 100%;
          opacity: 1;
        }
        
        .progress-circle {
          transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Futuristic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 px-4">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-900/20 blur-[120px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-cyan-900/20 blur-[120px]"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto py-6 px-3 sm:px-4">
        {/* Profile Card */}
        <div className="dark-glass neon-border rounded-3xl p-6 mb-8 animate-slideIn">
          <div className="relative z-10 flex flex-col items-center">
            {profileImage ? (
              <div className="relative inline-block w-full">
                <div className="w-36 h-36 mx-auto mb-5 relative group animate-float">
                  <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-500 rounded-[2rem] rotate-45 group-hover:rotate-90 transition-all duration-500 opacity-60 blur-xl"></div>
                  <div className="absolute inset-1 bg-gray-900 rounded-[1.8rem] z-0"></div>
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="relative w-full h-full object-cover rounded-[1.8rem] border border-white/10 shadow-2xl z-10"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 20 20" fill="%234338ca"%3E%3Cpath fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-1/2 translate-x-16 -translate-y-2 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-400 rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-36 h-36 mx-auto mb-5 animate-float relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-[2rem] rotate-45 opacity-30 blur-xl"></div>
                <div className="relative w-full h-full rounded-[1.8rem] border hover:border-indigo-400/50 border-white/10 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm z-10 transition-colors">
                  <Camera className="text-indigo-400/70" size={40} strokeWidth={1.5} />
                </div>
              </div>
            )}
            <div className="w-full flex flex-col gap-3 mt-2">
              <CloudinaryUpload
                currentUrl={profileImage}
                label="Upload Avatar"
                showPreview={false}
                onUpload={(url) => {
                  setProfileImage(url || null);
                  if (url) localStorage.setItem('profileImage', url);
                  else localStorage.removeItem('profileImage');
                }}
              />
            </div>
          </div>
        </div>

        {/* Cyber Clock Widget */}
        <div className="dark-glass neon-border rounded-3xl p-6 mb-8 animate-slideIn" style={{ animationDelay: '0.1s' }}>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-gray-900/50 border border-white/5">
              <Clock className="text-cyan-400" size={16} />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{dayStr}</span>
            </div>

            <div className="flex items-end justify-center gap-2 my-2 relative">
              <span className="text-5xl sm:text-7xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {timeStr}
              </span>
              <div className="flex flex-col items-start pb-2">
                <span className="text-lg font-bold text-cyan-400">{ampm}</span>
                <span className="text-sm font-mono text-fuchsia-400/80">{secondsStr}</span>
              </div>
            </div>

            <div className="text-sm font-medium text-gray-500 tracking-widest uppercase mt-2">
              {dateStr}
            </div>
          </div>
        </div>

        <TodaysQuotes />

        {/* Progress Display */}
        {todos.length > 0 && (
          <div className="dark-glass neon-border rounded-3xl p-6 mb-8 animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Systems Status</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    {completionPercentage}
                  </span>
                  <span className="text-xl text-cyan-400/60">%</span>
                </div>
              </div>

              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="transform -rotate-90 w-24 h-24 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="url(#neonGradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                    className="progress-circle"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c026d3" /> {/* Fuchsia 600 */}
                      <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan 500 */}
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="px-2 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-xl font-medium text-indigo-400 mb-1">{todos.length}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
              </div>
              <div className="px-2 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-xl font-medium text-cyan-400 mb-1">{completedCount}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Done</p>
              </div>
              <div className="px-2 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-xl font-medium text-fuchsia-400 mb-1">{todos.length - completedCount}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Transactions (Finance Vault) */}
        <div className="dark-glass rounded-2xl p-5 mb-6 animate-slideIn" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100 tracking-wide">Today's Transactions</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Finance Vault</p>
              </div>
            </div>
            <button onClick={() => navigate('/money')}
              className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors">
              View All →
            </button>
          </div>

          {(todayIncome > 0 || todayExpense > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="px-3 py-2.5 bg-gray-900/60 rounded-xl border border-emerald-500/10 flex items-center gap-2">
                <ArrowUpRight size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">₹{todayIncome.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Income</p>
                </div>
              </div>
              <div className="px-3 py-2.5 bg-gray-900/60 rounded-xl border border-rose-500/10 flex items-center gap-2">
                <ArrowDownRight size={14} className="text-rose-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-rose-400">₹{todayExpense.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Expense</p>
                </div>
              </div>
            </div>
          )}

          {txLoading ? (
            <p className="text-xs text-gray-600 font-mono text-center py-4">Loading...</p>
          ) : todayTransactions.length === 0 ? (
            <p className="text-xs text-gray-600 font-mono text-center py-4">No transactions logged today.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todayTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-900/40 rounded-xl border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-gray-500">{t.category || 'Uncategorized'}</p>
                  </div>
                  <p className={`text-sm font-medium shrink-0 ml-3 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mission Directives Header */}
        <div className="flex items-center justify-between mb-6 px-2 animate-slideIn" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-100 tracking-wide">
              Directives
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
                <Flame size={14} className="text-orange-400" />
                <span className="text-xs font-bold text-orange-400">{streak}d</span>
              </div>
            )}
            <button
              onClick={handleRegenerate}
              disabled={!canRegenerate}
              className={`p-3 rounded-xl transition-all ${canRegenerate
                  ? 'bg-fuchsia-600/20 border border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-600/40 animate-glowPulse'
                  : 'bg-gray-800/50 border border-white/5 text-gray-600 cursor-not-allowed'
                }`}
            >
              <RefreshCw size={18} className={canRegenerate ? 'animate-spin-slow' : ''} />
            </button>
          </div>
        </div>

        {/* Input Terminal */}
        <div className="mb-6 animate-slideIn" style={{ animationDelay: '0.4s' }}>
          <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl border border-indigo-500/30 overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-fuchsia-500 to-cyan-500"></div>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Initialize new objective..."
              className="futuristic-input w-full px-6 py-4 pl-8 pr-16 bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none focus:bg-gray-800/50 transition-colors"
            />
            <button
              onClick={handleAddTodo}
              disabled={addingTodo}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
            >
              <Plus size={20} strokeWidth={2.5} className={addingTodo ? 'animate-spin' : ''} />
            </button>
          </div>
          {/* Priority + Due Time row */}
          <div className="flex gap-1.5 sm:gap-2 mt-2">
            {['high','medium','low'].map(p => (
              <button key={p} onClick={() => setNewPriority(p)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all"
                style={newPriority === p
                  ? { background: p==='high'?'rgba(248,113,113,0.2)':p==='low'?'rgba(74,222,128,0.2)':'rgba(250,204,21,0.2)',
                      border: `1px solid ${p==='high'?'#f87171':p==='low'?'#4ade80':'#facc15'}80`,
                      color: p==='high'?'#f87171':p==='low'?'#4ade80':'#facc15' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                {p==='high'?'🔴':p==='low'?'🟢':'🟡'} {p}
              </button>
            ))}
            <input type="time" value={newDueTime} onChange={e => setNewDueTime(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        </div>

        {/* Mission Log (Tasks List) */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-indigo-900 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-indigo-400/60 text-sm tracking-widest uppercase">Syncing...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="dark-glass rounded-3xl p-8 text-center border border-white/5 animate-slideIn" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl"></div>
                <Sparkles className="text-cyan-500/70 relative z-10" size={28} />
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">Mission Log Empty</p>
              <p className="text-gray-600 text-xs">Initialize an objective above to sync.</p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.id}
                className="animate-slideIn relative group"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                {/* XP Popup */}
                {xpPopup?.id === todo.id && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 text-xs font-bold text-yellow-400 animate-bounce pointer-events-none">
                    +{xpPopup.xp} XP ⚡
                  </div>
                )}
                {editingId === todo.id ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-900 border border-indigo-500/50 rounded-2xl relative z-10">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-indigo-400"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(todo.id)} className="p-2.5 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/40 rounded-xl transition-all border border-cyan-500/30">
                      <Check size={16} />
                    </button>
                    <button onClick={cancelEdit} className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl transition-all border border-red-500/30">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center gap-4 z-10 ${todo.completed
                      ? 'bg-gray-900/40 border-green-500/20'
                      : 'bg-gray-800/60 border-white/5 hover:bg-gray-800 hover:border-indigo-500/30 backdrop-blur-sm'
                    }`}>
                    {/* Hover flare */}
                    {!todo.completed && (
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    )}

                    <button
                      onClick={() => handleToggle(todo.id)}
                      className={`relative flex-shrink-0 w-6 h-6 rounded-md border text-white transition-all transform hover:scale-110 flex items-center justify-center ${todo.completed
                          ? 'bg-green-500/20 border-green-500 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                          : 'bg-transparent border-gray-600 hover:border-cyan-400'
                        }`}
                    >
                      {todo.completed && <Check size={14} strokeWidth={3} />}
                    </button>

                    <span className={`flex-1 text-sm transition-all ${todo.completed
                        ? 'line-through text-gray-600'
                        : 'text-gray-300 font-medium group-hover:text-gray-100'
                      }`}>
                      {todo.title}
                      {todo.due_time && <span className="ml-2 text-[10px] font-mono text-cyan-500/60">{todo.due_time.slice(0,5)}</span>}
                    </span>
                    {todo.priority && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ color: todo.priority==='high'?'#f87171':todo.priority==='low'?'#4ade80':'#facc15',
                          background: todo.priority==='high'?'rgba(248,113,113,0.1)':todo.priority==='low'?'rgba(74,222,128,0.1)':'rgba(250,204,21,0.1)' }}>
                        {todo.priority==='high'?'🔴':todo.priority==='low'?'🟢':'🟡'}
                      </span>
                    )}

                    <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(todo.id, todo.title)}
                        className="p-1.5 bg-gray-700/50 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-lg transition-all border border-transparent hover:border-indigo-500/30"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="p-1.5 bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}