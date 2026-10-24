import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit2, Calendar, ChevronDown, ChevronUp, RefreshCw, Zap, Search, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  Card, CardHeader, CardBody, Badge, Button, IconButton, Input, Checkbox,
  Modal, ConfirmDialog, Table, EmptyState, SkeletonCard, useToast,
} from './ui';

const supabaseUrl = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PreviousTodos() {
  const toast = useToast();

  const [todosByDate, setTodosByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [expandedDates, setExpandedDates] = useState({});
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatingDate, setRecalculatingDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, dateKey, title }

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

      toast.success(`Bulk recalculation complete. Processed: ${processed} days, Failed: ${failed} days`);
    } catch (error) {
      console.error("Error in bulk recalculation:", error);
      toast.error('Failed to recalculate all data: ' + error.message);
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
      toast.error("Failed to update todo. Please try again.");
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
      toast.error("Failed to delete todo. Please try again.");
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
      toast.error("Failed to edit todo. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const findDateKeyForTodo = (id) => {
    for (const [dateKey, list] of Object.entries(todosByDate)) {
      if (list.some(t => t.id === id)) return dateKey;
    }
    return null;
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

      toast.success(`Performance recalculated for ${new Date(dateStr).toLocaleDateString()}: ${autoPoints}/10, ${completed}/${total} tasks (${percentage.toFixed(0)}%), ${status.toUpperCase()}`);
    } catch (error) {
      console.error("Error recalculating date:", error);
      toast.error('Failed to recalculate: ' + error.message);
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

  // Client-side search filter over the already-loaded data (no new query)
  const filteredTodosByDate = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return todosByDate;

    const result = {};
    Object.entries(todosByDate).forEach(([dateKey, list]) => {
      const filtered = list.filter(t => t.title.toLowerCase().includes(q));
      if (filtered.length > 0) result[dateKey] = filtered;
    });
    return result;
  }, [todosByDate, searchQuery]);

  const dates = Object.keys(filteredTodosByDate).sort((a, b) => b.localeCompare(a));
  const hasAnyHistory = Object.keys(todosByDate).length > 0;

  const getColumns = (dateKey) => [
    {
      key: 'done',
      header: '',
      width: '44px',
      render: (t) => (
        <Checkbox checked={!!t.completed} onChange={() => handleToggle(t.id, t.completed)} />
      ),
    },
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <span className={t.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}>
          {t.title}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label="Edit task" onClick={() => startEdit(t.id, t.title)}>
            <Edit2 size={15} />
          </IconButton>
          <IconButton
            label="Delete task"
            variant="danger"
            onClick={() => setDeleteConfirm({ id: t.id, dateKey, title: t.title })}
          >
            <Trash2 size={15} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Previous Todos</h1>
            <p className="text-sm text-[var(--text-muted)]">Historical tasks grouped by date</p>
          </div>
        </div>

        {hasAnyHistory && (
          <Button
            variant="primary"
            icon={<Zap size={16} />}
            loading={recalculating}
            onClick={() => setConfirmBulkOpen(true)}
          >
            Recalculate All
          </Button>
        )}
      </div>

      {/* Search */}
      {hasAnyHistory && (
        <Input
          placeholder="Search tasks by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leadingIcon={<Search size={16} />}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : dates.length === 0 ? (
        <Card>
          {searchQuery.trim() ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No matching tasks"
              message={`No tasks found matching "${searchQuery}".`}
            />
          ) : (
            <EmptyState
              icon={<Calendar size={24} />}
              title="No history yet"
              message="Completed and past tasks will show up here once a day passes."
            />
          )}
        </Card>
      ) : (
        dates.map((dateKey) => {
          const fullList = todosByDate[dateKey] || [];
          const visibleList = filteredTodosByDate[dateKey] || [];
          const stats = getDateStats(fullList);
          const isExpanded = !!expandedDates[dateKey];
          const isRecalculatingThisDate = recalculating && recalculatingDate === dateKey;
          const statVariant = stats.percentage >= 70 ? 'success' : stats.percentage >= 40 ? 'warning' : 'danger';

          return (
            <Card key={dateKey}>
              <div onClick={() => toggleDateExpansion(dateKey)} className="cursor-pointer">
                <CardHeader
                  icon={<Calendar size={18} />}
                  title={formatDate(dateKey)}
                  subtitle={`${stats.completed}/${stats.total} completed`}
                  action={
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant={statVariant}>{stats.percentage}%</Badge>
                      <IconButton
                        label="Recalculate performance"
                        onClick={() => recalculateSpecificDate(dateKey)}
                        disabled={isRecalculatingThisDate}
                      >
                        <RefreshCw size={16} className={isRecalculatingThisDate ? 'animate-spin' : ''} />
                      </IconButton>
                      <IconButton
                        label={isExpanded ? 'Collapse' : 'Expand'}
                        onClick={() => toggleDateExpansion(dateKey)}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </IconButton>
                    </div>
                  }
                />
              </div>

              {isExpanded && (
                <CardBody>
                  <Table
                    columns={getColumns(dateKey)}
                    data={visibleList}
                    rowKey={(t) => t.id}
                    pageSize={8}
                    emptyState={
                      <EmptyState
                        icon={<Calendar size={20} />}
                        title="No tasks"
                        message="There are no tasks logged for this date."
                      />
                    }
                  />
                </CardBody>
              )}
            </Card>
          );
        })
      )}

      {/* Edit Task Modal */}
      <Modal
        open={editingId !== null}
        onClose={cancelEdit}
        title="Edit Task"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={() => handleEdit(editingId, findDateKeyForTodo(editingId))}>Save Changes</Button>
          </>
        }
      >
        <Input
          label="Task title"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
        />
      </Modal>

      {/* Bulk Recalculate Confirm */}
      <ConfirmDialog
        open={confirmBulkOpen}
        onClose={() => setConfirmBulkOpen(false)}
        onConfirm={async () => {
          setConfirmBulkOpen(false);
          await recalculateAllPreviousDates();
        }}
        title="Recalculate All Previous Dates"
        message="This will recalculate performance data for all previous dates. This may take a while. Continue?"
        confirmLabel="Recalculate"
        danger={false}
        loading={recalculating}
      />

      {/* Delete Task Confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          await handleDelete(deleteConfirm.id, deleteConfirm.dateKey);
          setDeleteConfirm(null);
        }}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
