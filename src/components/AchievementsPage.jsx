import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
  Zap,
  Crown,
  Clock,
  TrendingDown,
  X,
  Check,
  Gift,
  Lock,
} from "lucide-react";
import Navbar from "./NavBar";

const supabaseUrl = "https://qwjujuvtfqahapohhfzs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
      alert(`🎁 Reward unlocked: ${names}`);
    }
  }

  async function markDay(achievementId, done) {
    const achievement = achievements.find((a) => a.id === achievementId);
    const existing = achievement?.logs.find((l) => l.log_date === todayStr);
    // clicking the already-active state clears today's log back to unmarked
    const clearing = existing && existing.done === done;

    const { error } = clearing
      ? await supabase
          .from("achievement_logs")
          .delete()
          .eq("achievement_id", achievementId)
          .eq("log_date", todayStr)
      : await supabase
          .from("achievement_logs")
          .upsert(
            { achievement_id: achievementId, log_date: todayStr, done },
            { onConflict: "achievement_id,log_date" }
          );

    if (error) {
      console.error("Error logging directive:", error);
      alert("Failed to save today's log. Please try again.");
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
      alert("Please fill in all required fields including dates");
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
        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <Crown size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline">Completed</span>
          <span className="xs:hidden">Done</span>
        </div>
      );
    }

    if (achievement.isOnTrack) {
      return (
        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
          <span>Nominal</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.2)]">
        <TrendingDown size={12} className="sm:w-3.5 sm:h-3.5" />
        <span>Suboptimal</span>
      </div>
    );
  };

  return (
    <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
      <Navbar />
      <style>{`
        .dash-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(134,151,196,0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .dash-input {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(112,145,230,0.35);
          color: #3D52A0;
          transition: all 0.3s ease;
        }
        .dash-input:focus {
          border-color: rgba(61,82,160,0.5);
          box-shadow: 0 0 10px rgba(61,82,160,0.2);
          outline: none;
        }
        .dash-btn {
          background: linear-gradient(to right, rgba(61,82,160,0.8), rgba(112,145,230,0.8));
          color: white;
          border: 1px solid rgba(61,82,160,0.5);
          transition: all 0.3s ease;
        }
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(61,82,160,1), rgba(112,145,230,1));
          box-shadow: 0 0 15px rgba(61,82,160,0.4);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-6 relative">
          <div className="flex-1 z-10">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="p-2 sm:p-2.5 md:p-3 dash-glass rounded-xl sm:rounded-2xl border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tight">
                  Core Directives
                </h1>
                <p className="text-cyan-400/60 font-mono text-xs sm:text-sm tracking-widest uppercase mt-0.5 sm:mt-1">
                  Macro Objective Telemetry
                </p>
              </div>
            </div>
          </div>

          <div className="z-10 mt-2 sm:mt-0">
            <button
              onClick={() => setFormOpen(!formOpen)}
              className="w-full sm:w-auto dash-btn group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 text-xs tracking-widest uppercase"
            >
              <Plus size={16} className="sm:w-4 sm:h-4 text-white group-hover:rotate-90 transition-transform" />
              <span>Establish Directive</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {achievements.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10">
            <div className="dash-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0 opacity-50"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                <div className="flex-1">
                  <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase mb-0.5 sm:mb-1">Active Profiles</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-light text-cyan-400">{achievements.length}</p>
                </div>
                <div className="hidden sm:flex p-2 md:p-3 bg-cyan-900/30 border border-cyan-500/20 rounded-lg md:rounded-xl self-start">
                  <Target className="text-cyan-500 w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </div>

            <div className="dash-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                <div className="flex-1">
                  <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase mb-0.5 sm:mb-1">Terminated</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-light text-emerald-400">
                    {achievements.filter(a => a.autoCurrentValue >= a.target_value).length}
                  </p>
                </div>
                <div className="hidden sm:flex p-2 md:p-3 bg-emerald-900/30 border border-emerald-500/20 rounded-lg md:rounded-xl self-start">
                  <Crown className="text-emerald-500 w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </div>

            <div className="dash-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500 to-indigo-500/0 opacity-50"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                <div className="flex-1">
                  <p className="text-[10px] sm:text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase mb-0.5 sm:mb-1">Executing</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-light text-indigo-400">
                    {achievements.filter(a => a.autoCurrentValue < a.target_value).length}
                  </p>
                </div>
                <div className="hidden sm:flex p-2 md:p-3 bg-indigo-900/30 border border-indigo-500/20 rounded-lg md:rounded-xl self-start">
                  <TrendingUp className="text-indigo-500 w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Form - Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 shadow-2xl transition-all">
            <div className="dash-glass rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slideIn">
              <div className="sticky top-0 bg-gray-900/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-cyan-900/30 border border-cyan-500/30 rounded-xl">
                    <Sparkles className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-200">
                    Deploy New Directive
                  </h2>
                </div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-white/10"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={createAchievement} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                    Directive Designation *
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. Protocol Omega"
                    className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm sm:text-base placeholder-gray-600"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                {/* Target Value */}
                <div>
                  <label htmlFor="target_value" className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                    Termination Value *
                  </label>
                  <input
                    id="target_value"
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm sm:text-base placeholder-gray-600"
                    value={form.target_value}
                    onChange={(e) =>
                      setForm({ ...form, target_value: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                    Operational Matrix Focus
                  </label>
                  <textarea
                    id="description"
                    placeholder="Provide detailed schema..."
                    rows={3}
                    className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-cyan-500/50 resize-none text-sm sm:text-base placeholder-gray-600"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="start_date" className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                      Initial Boot Sequence *
                    </label>
                    <input
                      id="start_date"
                      type="date"
                      className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm sm:text-base"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({ ...form, start_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="target_date" className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                      Deadline Horizon *
                    </label>
                    <input
                      id="target_date"
                      type="date"
                      className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm sm:text-base"
                      value={form.target_date}
                      onChange={(e) =>
                        setForm({ ...form, target_date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900/50 text-gray-400 border border-white/10 rounded-xl font-semibold hover:bg-gray-800 transition-all text-xs tracking-widest uppercase"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.title.trim() || !form.target_value}
                    className="flex-1 py-3.5 sm:py-4 dash-btn rounded-xl font-semibold shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 text-xs tracking-widest uppercase transition-all"
                  >
                    {loading ? "Compiling..." : "Deploy Directive"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        {loading ? (
          <div className="flex justify-center py-16 sm:py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
              <div className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">Running Diagnostics...</div>
            </div>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20 px-4 dash-glass rounded-3xl mt-6">
            <div className="inline-flex p-6 sm:p-8 bg-gray-900/50 border border-white/5 rounded-3xl mb-4 sm:mb-6">
              <Trophy className="text-gray-600 w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-300 mb-2 sm:mb-3">
              Unassigned Protocol
            </h3>
            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-6 sm:mb-8 max-w-md mx-auto">
              Inject primary directives to commence telemetry tracking
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 dash-btn rounded-xl font-bold transition-all hover:scale-105 text-xs uppercase tracking-widest"
            >
              <Plus size={16} className="sm:w-4 sm:h-4" />
              Configure System
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const percentage =
                (achievement.autoCurrentValue / achievement.target_value) * 100;
              const isCompleted = percentage >= 100;

              return (
                <div
                  key={achievement.id}
                  className={`group dash-glass rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-5px_rgba(34,211,238,0.15)] ${isCompleted ? 'border-emerald-500/30' : 'hover:border-cyan-500/30'}`}
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5 md:p-6 border-b border-white/5 bg-gray-900/40 relative">
                    {isCompleted && <div className="absolute inset-0 bg-emerald-500/5 z-0 pointer-events-none"></div>}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                      <h3 className={`text-base sm:text-lg md:text-xl font-bold line-clamp-2 flex-1 transition-colors ${isCompleted ? 'text-emerald-400' : 'text-gray-200 group-hover:text-cyan-400'}`}>
                        {achievement.title}
                      </h3>
                      {getStatusBadge(achievement)}
                    </div>

                    {achievement.description && (
                      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 relative z-10 font-light">
                        {achievement.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6 relative">
                    {/* Circular Progress */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-gray-800 sm:hidden"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-gray-800 hidden sm:block"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            fill="none"
                            stroke={isCompleted ? "url(#gradientCompleteDark)" : "url(#gradientProgressDark)"}
                            strokeWidth="6"
                            strokeDasharray={`${(percentage / 100) * 301.593} 301.593`}
                            className="transition-all duration-1000 sm:hidden drop-shadow-md"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke={isCompleted ? "url(#gradientCompleteDark)" : "url(#gradientProgressDark)"}
                            strokeWidth="8"
                            strokeDasharray={`${(percentage / 100) * 351.858} 351.858`}
                            className="transition-all duration-1000 hidden sm:block drop-shadow-md"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient
                              id="gradientCompleteDark"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                            <linearGradient
                              id="gradientProgressDark"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`text-2xl sm:text-3xl font-light ${isCompleted ? 'text-emerald-400' : 'text-gray-200'}`}>
                            {Math.round(percentage)}<span className="text-sm text-gray-500">%</span>
                          </div>
                          <div className="text-[10px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                            Yield
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-cyan-500/10">
                        <div className="text-lg font-light text-cyan-400">
                          {achievement.autoCurrentValue}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mt-0.5">
                          Current
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-amber-500/10">
                        <div className="text-lg font-light text-amber-500">
                          {achievement.target_value - achievement.autoCurrentValue}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mt-0.5">
                          Delta
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-emerald-500/10">
                        <div className="text-lg font-light text-emerald-400">
                          {achievement.target_value}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mt-0.5">
                          Target
                        </div>
                      </div>
                    </div>

                    {/* Daily Progress Info */}
                    {achievement.dailyTarget && (
                      <div className="bg-gray-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">
                            Required Velocity
                          </span>
                          <span className="text-xs font-bold text-cyan-400">
                            {achievement.dailyTarget} / cycle
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-cyan-600/50" />
                            <span>T+{achievement.daysPassed}</span>
                          </div>
                          <span>T-{achievement.daysRemaining}</span>
                        </div>
                      </div>
                    )}

                    {/* Daily Did / Didn't Log */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 sm:p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                          <Zap size={14} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase font-mono tracking-widest text-indigo-300">
                            Today's Log
                          </div>
                          <div className="text-xs font-light text-gray-400 mt-0.5">
                            {achievement.todayLog
                              ? achievement.todayLog.done
                                ? "Marked as done today"
                                : "Marked as missed today"
                              : "Not logged yet today"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => markDay(achievement.id, true)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            achievement.todayLog?.done
                              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                              : "bg-gray-900/40 border border-white/10 text-gray-400 hover:border-emerald-500/40 hover:text-emerald-400"
                          }`}
                        >
                          <Check size={12} /> Did
                        </button>
                        <button
                          onClick={() => markDay(achievement.id, false)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            achievement.todayLog && !achievement.todayLog.done
                              ? "bg-rose-500/20 border border-rose-500/50 text-rose-400"
                              : "bg-gray-900/40 border border-white/10 text-gray-400 hover:border-rose-500/40 hover:text-rose-400"
                          }`}
                        >
                          <X size={12} /> Didn't
                        </button>
                      </div>
                    </div>

                    {/* Linked Reward */}
                    {achievement.reward && (
                      <div
                        className={`flex items-center gap-2 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border text-[10px] font-mono uppercase tracking-widest ${
                          achievement.reward.unlocked
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-gray-900/40 border-white/10 text-gray-500"
                        }`}
                      >
                        {achievement.reward.unlocked ? <Gift size={13} /> : <Lock size={13} />}
                        <span className="truncate flex-1">{achievement.reward.reward_title}</span>
                        <span>{achievement.reward.unlocked ? "Unlocked" : "Locked"}</span>
                      </div>
                    )}

                    {/* Timeline */}
                    {achievement.start_date && achievement.target_date && (
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 pt-3 border-t border-white/5">
                        <Calendar size={12} className="text-cyan-500/50 shrink-0" />
                        <span className="truncate">
                          {new Date(achievement.start_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                          <span className="mx-1 text-gray-700">→</span>
                          {new Date(achievement.target_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}