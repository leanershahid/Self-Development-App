import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Crown,
  Clock,
  TrendingDown,
  X,
  Check,
  Gift,
  Lock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  KpiCard,
  Button,
  Input,
  DateField,
  Textarea,
  Modal,
  EmptyState,
  SkeletonCard,
  Tabs,
  useToast,
} from "./ui";
import AchievementCalendar from "./AchievementCalendar";

const supabaseUrl = "https://qwjujuvtfqahapohhfzs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AchievementsPage() {
  const toast = useToast();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [form, setForm] = useState({
    title: "",
    description: "",
    target_value: "",
    start_date: new Date().toISOString().split("T")[0],
    target_date: "",
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  async function fetchAchievements() {
    setLoading(true);
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    const ids = (data || []).map((a) => a.id);
    let logsByAchievement = {};
    let rewardByAchievement = {};
    if (ids.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("achievement_logs")
        .select("*")
        .in("achievement_id", ids);
      if (logsError) console.error("Error fetching achievement logs:", logsError);
      logsByAchievement = (logs || []).reduce((acc, log) => {
        (acc[log.achievement_id] ||= []).push(log);
        return acc;
      }, {});

      const { data: linkedRewards, error: rewardsError } = await supabase
        .from("rewards")
        .select("achievement_id, reward_title, unlocked")
        .in("achievement_id", ids);
      if (rewardsError) console.error("Error fetching linked rewards:", rewardsError);
      rewardByAchievement = (linkedRewards || []).reduce((acc, r) => {
        acc[r.achievement_id] = r;
        return acc;
      }, {});
    }

    const enrichedData = (data || []).map((achievement) => {
      const logs = logsByAchievement[achievement.id] || [];
      return {
        ...achievement,
        logs,
        reward: rewardByAchievement[achievement.id] || null,
        ...calculateProgress(achievement, logs),
      };
    });

    setAchievements(enrichedData);

    const completed = enrichedData.filter(
      (a) => a.autoCurrentValue >= a.target_value
    );
    await syncRewardUnlocks(completed);

    setLoading(false);
  }

  // When an achievement's period completes (its logged progress reaches the
  // target value), unlock any reward linked to it via rewards.achievement_id.
  async function syncRewardUnlocks(completedAchievements) {
    if (completedAchievements.length === 0) return;

    const ids = completedAchievements.map((a) => a.id);
    const { data: justUnlocked, error } = await supabase
      .from("rewards")
      .update({ unlocked: true, unlocked_on: new Date().toISOString() })
      .in("achievement_id", ids)
      .eq("unlocked", false)
      .select("reward_title");

    if (error) {
      console.error("Error unlocking linked rewards:", error);
      return;
    }

    if (justUnlocked && justUnlocked.length > 0) {
      const names = justUnlocked.map((r) => r.reward_title).join(", ");
      toast.success(`Reward unlocked: ${names}`);
    }
  }

  async function markDay(achievementId, done, dateStr = todayStr) {
    if (dateStr > todayStr) {
      toast.error("You can't log a future day.");
      return;
    }

    const achievement = achievements.find((a) => a.id === achievementId);
    const existing = achievement?.logs.find((l) => l.log_date === dateStr);
    // clicking the already-active state clears that day's log back to unmarked
    const clearing = existing && existing.done === done;

    const { error } = clearing
      ? await supabase
          .from("achievement_logs")
          .delete()
          .eq("achievement_id", achievementId)
          .eq("log_date", dateStr)
      : await supabase
          .from("achievement_logs")
          .upsert(
            { achievement_id: achievementId, log_date: dateStr, done },
            { onConflict: "achievement_id,log_date" }
          );

    if (error) {
      console.error("Error logging directive:", error);
      toast.error("Failed to save the log. Please try again.");
      return;
    }
    await fetchAchievements();
  }

  function calculateProgress(achievement, logs = []) {
    const doneCount = logs.filter((l) => l.done).length;
    const todayLog = logs.find((l) => l.log_date === todayStr);

    if (!achievement.start_date || !achievement.target_date) {
      return {
        daysPassed: 0,
        totalDays: 0,
        expectedProgress: 0,
        isOnTrack: true,
        daysRemaining: 0,
        autoCurrentValue: doneCount,
        todayLog,
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(achievement.start_date);
    start.setHours(0, 0, 0, 0);

    const target = new Date(achievement.target_date);
    target.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.ceil((target - start) / (1000 * 60 * 60 * 24))
    );

    const daysPassed = Math.max(
      0,
      Math.min(totalDays, Math.ceil((now - start) / (1000 * 60 * 60 * 24)))
    );

    const daysRemaining = Math.max(
      0,
      Math.ceil((target - now) / (1000 * 60 * 60 * 24))
    );

    const expectedProgress = Math.min(
      achievement.target_value,
      Math.floor((achievement.target_value / totalDays) * daysPassed)
    );

    const actualCurrentValue = Math.min(achievement.target_value, doneCount);

    const actualPercentage =
      (actualCurrentValue / achievement.target_value) * 100;
    const expectedPercentage = (expectedProgress / achievement.target_value) * 100;

    return {
      daysPassed,
      totalDays,
      daysRemaining,
      expectedProgress,
      isOnTrack: actualPercentage >= expectedPercentage - 5,
      dailyTarget: (achievement.target_value / totalDays).toFixed(1),
      autoCurrentValue: actualCurrentValue,
      todayLog,
    };
  }

  async function createAchievement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.target_value || !form.start_date || !form.target_date) {
      toast.error("Please fill in all required fields including dates");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("achievements").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      target_value: Number(form.target_value),
      current_value: 0,
      start_date: form.start_date,
      target_date: form.target_date,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to create achievement. Please try again.");
      setLoading(false);
      return;
    }

    setForm({
      title: "",
      description: "",
      target_value: "",
      start_date: new Date().toISOString().split("T")[0],
      target_date: "",
    });

    setFormOpen(false);
    await fetchAchievements();
    setLoading(false);
  }

  const getStatusBadge = (achievement) => {
    const isCompleted = achievement.autoCurrentValue >= achievement.target_value;

    if (isCompleted) {
      return (
        <Badge variant="success">
          <Crown size={12} />
          Completed
        </Badge>
      );
    }

    if (achievement.isOnTrack) {
      return (
        <Badge variant="primary">
          <TrendingUp size={12} />
          On Track
        </Badge>
      );
    }

    return (
      <Badge variant="danger">
        <TrendingDown size={12} />
        Behind
      </Badge>
    );
  };

  const activeCount = achievements.length;
  const completedCount = achievements.filter(
    (a) => a.autoCurrentValue >= a.target_value
  ).length;
  const executingCount = achievements.filter(
    (a) => a.autoCurrentValue < a.target_value
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Achievements</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Track your goals and daily progress
            </p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
          New Achievement
        </Button>
      </div>

      {/* Stats Overview */}
      {achievements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={<Target size={18} />} label="Active" value={activeCount} tone="primary" />
          <KpiCard icon={<Crown size={18} />} label="Completed" value={completedCount} tone="accent" />
          <KpiCard icon={<TrendingUp size={18} />} label="Executing" value={executingCount} tone="primary" />
        </div>
      )}

      {achievements.length > 0 && (
        <Tabs
          value={viewMode}
          onChange={setViewMode}
          tabs={[
            { value: "grid", label: "Grid" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
      )}

      {/* Create Achievement Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Achievement"
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="achievement-form"
              loading={loading}
              disabled={loading || !form.title.trim() || !form.target_value}
            >
              Create Achievement
            </Button>
          </>
        }
      >
        <form
          id="achievement-form"
          onSubmit={createAchievement}
          className="flex flex-col gap-4"
        >
          <Input
            id="title"
            label="Title"
            placeholder="e.g. Read 50 books"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <Input
            id="target_value"
            type="number"
            min="1"
            label="Target Value"
            placeholder="e.g. 50"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: e.target.value })}
            required
          />

          <Textarea
            id="description"
            label="Description"
            placeholder="Add more detail about this goal..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="start_date"
              label="Start Date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />

            <DateField
              id="target_date"
              label="Target Date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Achievements Grid */}
      {viewMode === "calendar" && achievements.length > 0 ? (
        <AchievementCalendar
          achievements={achievements}
          onToggleDay={(achievementId, dateStr, existingLog) =>
            markDay(achievementId, existingLog ? false : true, dateStr)
          }
        />
      ) : loading && achievements.length === 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="No achievements yet"
          message="Create your first achievement to start tracking progress toward your goals."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
              New Achievement
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const percentage =
              (achievement.autoCurrentValue / achievement.target_value) * 100;
            const isCompleted = percentage >= 100;

            return (
              <Card
                key={achievement.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <CardHeader
                  icon={<Target size={16} />}
                  title={achievement.title}
                  subtitle={achievement.description}
                  action={getStatusBadge(achievement)}
                />

                <CardBody className="flex flex-col gap-5">
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-[var(--surface-hover)]"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke={isCompleted ? "url(#gradientComplete)" : "url(#gradientProgress)"}
                          strokeWidth="8"
                          strokeDasharray={`${(percentage / 100) * 301.593} 301.593`}
                          className="transition-all duration-1000"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradientComplete" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                          <linearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e3a5f" />
                            <stop offset="100%" stopColor="#3b6ea5" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-2xl font-bold ${isCompleted ? "text-accent" : "text-[var(--text)]"}`}>
                          {Math.round(percentage)}
                          <span className="text-sm text-[var(--text-muted)]">%</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          Progress
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--surface-hover)] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-semibold text-primary">
                        {achievement.autoCurrentValue}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">
                        Current
                      </div>
                    </div>
                    <div className="bg-[var(--surface-hover)] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-semibold text-warning">
                        {achievement.target_value - achievement.autoCurrentValue}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">
                        Remaining
                      </div>
                    </div>
                    <div className="bg-[var(--surface-hover)] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-semibold text-accent">
                        {achievement.target_value}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">
                        Target
                      </div>
                    </div>
                  </div>

                  {/* Daily Progress Info */}
                  {achievement.dailyTarget && (
                    <div className="bg-[var(--surface-hover)] rounded-lg p-3 border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                          Required Pace
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {achievement.dailyTarget} / day
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Day {achievement.daysPassed}</span>
                        </div>
                        <span>{achievement.daysRemaining} days left</span>
                      </div>
                    </div>
                  )}

                  {/* Daily Did / Didn't Log */}
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/15">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                        <Zap size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--text)]">
                          Today's Log
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {achievement.todayLog
                            ? achievement.todayLog.done
                              ? "Marked as done today"
                              : "Marked as missed today"
                            : "Not logged yet today"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={achievement.todayLog?.done ? "success" : "secondary"}
                        icon={<Check size={14} />}
                        className="flex-1"
                        onClick={() => markDay(achievement.id, true)}
                      >
                        Did
                      </Button>
                      <Button
                        size="sm"
                        variant={achievement.todayLog && !achievement.todayLog.done ? "danger" : "secondary"}
                        icon={<X size={14} />}
                        className="flex-1"
                        onClick={() => markDay(achievement.id, false)}
                      >
                        Didn't
                      </Button>
                    </div>
                  </div>

                  {/* Linked Reward */}
                  {achievement.reward && (
                    <div className="flex items-center gap-2">
                      <Badge variant={achievement.reward.unlocked ? "success" : "neutral"}>
                        {achievement.reward.unlocked ? <Gift size={12} /> : <Lock size={12} />}
                        {achievement.reward.unlocked ? "Unlocked" : "Locked"}
                      </Badge>
                      <span className="text-xs text-[var(--text-muted)] truncate flex-1">
                        {achievement.reward.reward_title}
                      </span>
                    </div>
                  )}

                  {/* Timeline */}
                  {achievement.start_date && achievement.target_date && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
                      <Calendar size={12} className="shrink-0" />
                      <span className="truncate">
                        {new Date(achievement.start_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                        <span className="mx-1">→</span>
                        {new Date(achievement.target_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
