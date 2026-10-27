import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, X, RefreshCw, Clock, Sparkles, TrendingUp, Flame, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TodaysQuotes from './TodaysQuotes';
import HomeTrendCard from './HomeTrendCard';
import AchievementProgressChart from './AchievementProgressChart';
import CloudinaryUpload from './CloudinaryUpload';
import { useTodoReminder } from '../utils/useTodoReminder';
import {
  Card, CardHeader, CardBody, Button, IconButton, Input, Select, Checkbox,
  Badge, Avatar, Modal, ConfirmDialog, EmptyState, SkeletonText, SkeletonCard, useToast,
} from './ui';
import { supabase } from '../supabase';

export default function TodoList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [todos, setTodos]           = useState([]);
  const [newTodo, setNewTodo]       = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueTime, setNewDueTime] = useState('');
  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '/MyImage01.JPG');
  // eslint-disable-next-line no-unused-vars
  const [lastRegenerate, setLastRegenerate] = useState(localStorage.getItem('lastRegenerate') || null);
  const [addingTodo, setAddingTodo] = useState(false);
  const [xpPopup, setXpPopup]       = useState(null); // { id, xp }
  const [streak, setStreak]         = useState(() => parseInt(localStorage.getItem('todo_streak') || '0'));
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [txLoading, setTxLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      toast.error("This task already exists today!");
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
      toast.error("Failed to add todo. Please try again.");
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
      toast.error("Failed to update todo. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('ToDo').update({ active: false }).eq('id', id);
      if (error) throw error;
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete todo. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id);
    setDeleteTarget(null);
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
      toast.error("Failed to edit todo. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
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
        toast.info('All default tasks already exist today!');
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
      toast.error('Failed to regenerate todos. Please try again.');
    }
  };

  useTodoReminder(todos);

  const completedCount = todos.filter(t => t.completed).length;
  const canRegenerate = lastRegenerate !== new Date().toDateString();
  const completionPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = todayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const priorityBadgeVariant = (p) => (p === 'high' ? 'danger' : p === 'low' ? 'info' : 'warning');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* Hero: profile + live clock, side-by-side on wider screens, stacked on mobile */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row items-center gap-5 py-6">
          <div className="relative shrink-0">
            <Avatar src={profileImage || undefined} name="Profile" size="lg" className="w-20 h-20 text-xl ring-4 ring-[var(--surface-hover)]" />

            <CloudinaryUpload
              variant="avatar"
              currentUrl={profileImage}
              label="Change photo"
              className="absolute bottom-0 right-0"
              onUpload={(url) => {
                setProfileImage(url || null);
                if (url) localStorage.setItem('profileImage', url);
                else localStorage.removeItem('profileImage');
              }}
            />

            {profileImage && (
              <IconButton
                label="Remove photo"
                variant="danger"
                size="sm"
                className="absolute -top-1.5 -right-1.5 bg-[var(--surface)] border border-[var(--border)] shadow-sm"
                onClick={handleRemoveImage}
              >
                <X size={14} />
              </IconButton>
            )}
          </div>

          <div className="hidden sm:block w-px self-stretch bg-[var(--border)]" />

          <div className="flex flex-col items-center sm:items-start gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <Clock size={14} className="text-primary" /> {dayStr} · {dateStr}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl sm:text-5xl font-light text-[var(--text)] tracking-tight">{timeStr}</span>
              <div className="flex flex-col items-start pb-1">
                <span className="text-sm font-bold text-primary">{ampm}</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{secondsStr}</span>
              </div>
            </div>
            {streak > 0 && (
              <Badge variant="warning" className="mt-1">
                <Flame size={12} /> {streak} day streak
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>

      <HomeTrendCard />

      <AchievementProgressChart />

      <TodaysQuotes />

      {/* Progress */}
      {todos.length > 0 && (
        <Card>
          <CardHeader
            title="Today's Progress"
            subtitle={`${completionPercentage}% complete`}
            icon={<TrendingUp size={18} />}
          />
          <CardBody>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-[var(--surface-hover)]">
                <p className="text-xl font-semibold text-[var(--text)]">{todos.length}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-accent/10">
                <p className="text-xl font-semibold text-accent">{completedCount}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Done</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10">
                <p className="text-xl font-semibold text-warning">{todos.length - completedCount}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Pending</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Today's Transactions */}
      <Card>
        <CardHeader
          title="Today's Transactions"
          subtitle="Money overview"
          icon={<Wallet size={18} />}
          action={
            <button
              onClick={() => navigate('/money')}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              View all
            </button>
          }
        />
        <CardBody>
          {(todayIncome > 0 || todayExpense > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10">
                <ArrowUpRight size={16} className="text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-accent">₹{todayIncome.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Income</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10">
                <ArrowDownRight size={16} className="text-danger shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-danger">₹{todayExpense.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Expense</p>
                </div>
              </div>
            </div>
          )}

          {txLoading ? (
            <SkeletonText lines={3} />
          ) : todayTransactions.length === 0 ? (
            <EmptyState
              icon={<Wallet size={18} />}
              title="No transactions today"
              message="Nothing has been logged in Money yet today."
            />
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {todayTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-hover)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--text)] truncate">{t.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{t.category || 'Uncategorized'}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ml-3 ${t.type === 'income' ? 'text-accent' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader
          title="Today's Tasks"
          subtitle={streak > 0 ? `${streak} day streak` : 'Stay consistent today'}
          icon={<Sparkles size={18} />}
          action={
            <IconButton
              label="Regenerate default tasks"
              onClick={handleRegenerate}
              disabled={!canRegenerate}
            >
              <RefreshCw size={16} />
            </IconButton>
          }
        />
        <CardBody className="flex flex-col gap-5">
          {/* Add todo form */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a new task..."
                className="flex-1"
              />
              <Button onClick={handleAddTodo} disabled={addingTodo} loading={addingTodo} icon={<Plus size={18} />}>
                Add
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="flex-1">
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </Select>
              <Input
                type="time"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : todos.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={20} />}
              title="No tasks yet"
              message="Add your first task above to get started today."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="relative flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {xpPopup?.id === todo.id && (
                    <span className="absolute -top-5 left-10 text-xs font-bold text-warning animate-bounce pointer-events-none">
                      +{xpPopup.xp} XP
                    </span>
                  )}

                  <Checkbox checked={todo.completed} onChange={() => handleToggle(todo.id)} />

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${todo.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)] font-medium'}`}>
                      {todo.title}
                    </span>
                    {todo.due_time && (
                      <span className="ml-2 text-[10px] font-mono text-[var(--text-muted)]">
                        {todo.due_time.slice(0, 5)}
                      </span>
                    )}
                  </div>

                  {todo.priority && (
                    <Badge variant={priorityBadgeVariant(todo.priority)}>{todo.priority}</Badge>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton label="Edit task" onClick={() => startEdit(todo.id, todo.title)}>
                      <Edit2 size={14} />
                    </IconButton>
                    <IconButton label="Delete task" variant="danger" onClick={() => setDeleteTarget(todo)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit task modal */}
      <Modal
        open={!!editingId}
        onClose={cancelEdit}
        title="Edit task"
        footer={
          <>
            <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
            <Button variant="primary" onClick={() => handleEdit(editingId)}>Save</Button>
          </>
        }
      >
        <Input
          label="Task"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEdit(editingId)}
          autoFocus
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete task"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
