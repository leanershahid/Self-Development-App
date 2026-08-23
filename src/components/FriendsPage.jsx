import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { showLocalNotification } from "../utils/pushNotifications";
import {
  Plus,
  Users,
  Star,
  Phone,
  Edit2,
  X,
  Search,
  Heart,
  Sparkles,
  UserPlus,
  Crown,
  Award,
  Zap,
  MessageCircle,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import Navbar from "./NavBar";

import CloudinaryUpload from "./CloudinaryUpload";

const supabaseUrl = "https://quufeiwzsgiuwkeyjjns.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRIORITY_LEVELS = [
  {
    level: 1,
    label: "Best Friend",
    icon: Crown,
    color: "from-fuchsia-500 to-pink-500",
    bgColor: "from-fuchsia-500/10 to-pink-500/10",
    textColor: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/30",
    description: "Your closest companions",
    glow: "shadow-[0_0_15px_rgba(217,70,239,0.3)]"
  },
  {
    level: 2,
    label: "Close Friend",
    icon: Heart,
    color: "from-rose-500 to-red-500",
    bgColor: "from-rose-500/10 to-red-500/10",
    textColor: "text-rose-400",
    borderColor: "border-rose-500/30",
    description: "Very important people",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]"
  },
  {
    level: 3,
    label: "Good Friend",
    icon: Star,
    color: "from-amber-500 to-orange-500",
    bgColor: "from-amber-500/10 to-orange-500/10",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    description: "Regular hangout buddies",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]"
  },
  {
    level: 4,
    label: "Friend",
    icon: Award,
    color: "from-cyan-500 to-blue-500",
    bgColor: "from-cyan-500/10 to-blue-500/10",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    description: "Friends you see occasionally",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]"
  },
  {
    level: 5,
    label: "Acquaintance",
    icon: Zap,
    color: "from-slate-400 to-gray-500",
    bgColor: "from-slate-500/10 to-gray-500/10",
    textColor: "text-slate-400",
    borderColor: "border-slate-500/30",
    description: "People you know",
    glow: "shadow-[0_0_15px_rgba(148,163,184,0.2)]"
  },
];

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(null);

  const [guideOpen, setGuideOpen] = useState(false);
  const [tipsModal, setTipsModal] = useState(null); // friend object
  const [goalModal, setGoalModal] = useState(null); // friend object

  const [form, setForm] = useState({
    name: "",
    phone: "",
    priority_level: 3,
    image_url: "",
    meet_goal: "monthly",
  });

  const MEET_GOALS = [
    { value: "daily", label: "Daily", days: 1 },
    { value: "weekly", label: "Weekly", days: 7 },
    { value: "monthly", label: "Monthly", days: 30 },
    { value: "quarterly", label: "Quarterly", days: 90 },
  ];

  const RECONNECT_TIPS = [
    "Hey! Been a while — how have you been?",
    "I saw something that reminded me of you. Want to catch up?",
    "Let's grab coffee or a call soon!",
    "What's new with you lately?",
    "I miss hanging out. When are you free?",
    "Thinking of you — hope everything's going well!",
    "We should plan something soon. Any ideas?",
    "Random thought: remember when we [shared memory]? Good times!",
  ];

  function daysSinceContact(friend) {
    if (!friend.last_contacted) return null;
    const diff = Date.now() - new Date(friend.last_contacted).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function isOverdue(friend) {
    const days = daysSinceContact(friend);
    if (days === null) return false;
    const goal = MEET_GOALS.find(g => g.value === (friend.meet_goal || "monthly"));
    return days > (goal?.days || 30);
  }

  async function logContact(friend) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("friends").update({ last_contacted: today }).eq("id", friend.id);
    await fetchFriends();
  }

  async function saveMeetGoal(friend, goal) {
    await supabase.from("friends").update({ meet_goal: goal }).eq("id", friend.id);
    setGoalModal(null);
    await fetchFriends();
  }

  useEffect(() => {
    fetchFriends();
  }, []);

  // Fire local notifications for overdue friends once data loads
  useEffect(() => {
    if (friends.length === 0) return;
    const overdueFriends = friends.filter(isOverdue);
    if (overdueFriends.length === 0) return;
    const names = overdueFriends.slice(0, 3).map(f => f.name).join(', ');
    const extra = overdueFriends.length > 3 ? ` +${overdueFriends.length - 3} more` : '';
    showLocalNotification(
      `👥 ${overdueFriends.length} friend${overdueFriends.length > 1 ? 's' : ''} need your attention`,
      `You haven't contacted: ${names}${extra}`
    );
  }, [friends]);

  async function fetchFriends() {
    setLoading(true);
    const { data } = await supabase
      .from("friends")
      .select("*")
      .order("priority_level", { ascending: true })
      .order("name", { ascending: true });

    setFriends(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Please enter a name");
      return;
    }

    setLoading(true);

    const friendData = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      priority_level: Number(form.priority_level),
      image_url: form.image_url.trim() || null,
      meet_goal: form.meet_goal || "monthly",
    };

    let error;
    if (editingFriend) {
      ({ error } = await supabase
        .from("friends")
        .update(friendData)
        .eq("id", editingFriend.id));
    } else {
      ({ error } = await supabase.from("friends").insert(friendData));
    }

    if (error) {
      console.error(error);
      alert("Error saving friend");
      setLoading(false);
      return;
    }

    resetForm();
    await fetchFriends();
    setLoading(false);
  }

  function editFriend(friend) {
    setEditingFriend(friend);
    setForm({
      name: friend.name,
      phone: friend.phone || "",
      priority_level: friend.priority_level,
      image_url: friend.image_url || "",
      meet_goal: friend.meet_goal || "monthly",
    });
    setFormOpen(true);
  }

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      priority_level: 3,
      image_url: "",
      meet_goal: "monthly",
    });
    setEditingFriend(null);
    setFormOpen(false);
  }

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      selectedPriority === null || friend.priority_level === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const groupedFriends = PRIORITY_LEVELS.reduce((acc, priority) => {
    acc[priority.level] = filteredFriends.filter(
      (f) => f.priority_level === priority.level
    );
    return acc;
  }, {});

  const stats = {
    total: friends.length,
    byPriority: PRIORITY_LEVELS.map((p) => ({
      ...p,
      count: friends.filter((f) => f.priority_level === p.level).length,
    })),
  };

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
          border-color: rgba(217, 70, 239, 0.5);
          box-shadow: 0 0 10px rgba(217, 70, 239, 0.2);
          outline: none;
        }
        .dash-btn {
          background: linear-gradient(to right, rgba(217, 70, 239, 0.8), rgba(236, 72, 153, 0.8));
          color: white;
          border: 1px solid rgba(217, 70, 239, 0.5);
          transition: all 0.3s ease;
        }
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(217, 70, 239, 1), rgba(236, 72, 153, 1));
          box-shadow: 0 0 15px rgba(217, 70, 239, 0.4);
        }
      `}</style>


      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-6 relative">
          <div className="flex-1 z-10">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="p-2 sm:p-2.5 md:p-3 dash-glass rounded-xl sm:rounded-2xl border border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tight">
                  Network Directory
                </h1>
                <p className="text-fuchsia-400/60 font-mono text-xs sm:text-sm tracking-widest uppercase mt-0.5 sm:mt-1">
                  Social Topology & Priority
                </p>
              </div>
            </div>
          </div>

          <div className="z-10 mt-2 sm:mt-0">
            <button
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
              className="w-full sm:w-auto dash-btn group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 text-xs tracking-widest uppercase"
            >
              <UserPlus size={16} className="sm:w-4 sm:h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>Add Connection</span>
            </button>
          </div>
        </div>

        {/* How to Make Friends Guide */}
        <div className="dash-glass rounded-2xl mb-8 overflow-hidden border border-fuchsia-500/10">
          <button onClick={() => setGuideOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                <BookOpen size={15} className="text-fuchsia-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-200">How to Approach New People & Build Close Friends</p>
                <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">9-step social guide</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${guideOpen ? "rotate-180" : ""}`} />
          </button>

          {guideOpen && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-white/5 pt-4">
              {[
                { step: 1, title: "Start Conversation", color: "text-fuchsia-400", border: "border-fuchsia-500/20", bg: "bg-fuchsia-500/5", tips: ["Smile + simple greeting", "Ask easy questions (name, work, place)", "Don't overthink"] },
                { step: 2, title: "Show Interest", color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5", tips: ["Ask open-ended questions", "Listen carefully", "Maintain eye contact"] },
                { step: 3, title: "Share About Yourself", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5", tips: ["Talk a little about your interests", "Relate to what they say", "Keep it balanced (not one-sided)"] },
                { step: 4, title: "Find Common Ground", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", tips: ["Look for shared interests", "Agree or connect on small things", "Use: \"Same here\", \"I like that too\""] },
                { step: 5, title: "Keep It Natural", color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5", tips: ["Be yourself", "Don't try to impress", "It's okay to be slightly awkward"] },
                { step: 6, title: "Take Contact", color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5", tips: ["Ask for WhatsApp / Instagram", "Suggest meeting again", "Example: \"Let's catch up sometime\""] },
                { step: 7, title: "Follow Up", color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/5", tips: ["Send a message later", "Check in casually", "Keep conversations going"] },
                { step: 8, title: "Be Consistent", color: "text-pink-400", border: "border-pink-500/20", bg: "bg-pink-500/5", tips: ["Talk regularly", "Spend time together", "Build trust slowly"] },
                { step: 9, title: "Accept Reality", color: "text-slate-400", border: "border-slate-500/20", bg: "bg-slate-500/5", tips: ["Not everyone will connect", "Focus on people who respond well"] },
              ].map(({ step, title, color, border, bg, tips }) => (
                <div key={step} className={`rounded-xl p-4 border ${border} ${bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black font-mono ${color} bg-black/20 px-2 py-0.5 rounded-md border ${border}`}>0{step}</span>
                    <h4 className={`text-sm font-bold ${color}`}>{title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${color.replace("text-", "bg-")}`} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        {friends.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10">
            <div className="dash-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 relative overflow-hidden group col-span-2 sm:col-span-1">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500 to-fuchsia-500/0 opacity-50"></div>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500">
                    Total Links
                  </p>
                  <Users className="text-fuchsia-400 w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-light text-fuchsia-400">
                  {stats.total}
                </p>
              </div>
            </div>

            {stats.byPriority.slice(0, 5).map((priority) => {
              const Icon = priority.icon;
              return (
                <div
                  key={priority.level}
                  className="dash-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 relative overflow-hidden group border border-transparent hover:border-white/10 transition-colors"
                >
                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${priority.color} opacity-20 group-hover:opacity-50 transition-opacity`}></div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-gray-500 truncate">
                        {priority.label}
                      </p>
                      <Icon className={`${priority.textColor} w-3 h-3 sm:w-4 sm:h-4`} />
                    </div>
                    <p className={`text-xl sm:text-2xl font-light ${priority.textColor}`}>
                      {priority.count}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Filter */}
        {friends.length > 0 && (
          <div className="dash-glass rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Query profiles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 dash-input rounded-lg sm:rounded-xl text-sm sm:text-base font-mono placeholder-gray-600"
                />
              </div>

              {/* Priority Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <button
                  onClick={() => setSelectedPriority(null)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl font-semibold transition-all text-xs tracking-widest uppercase border ${selectedPriority === null
                      ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                      : "bg-gray-900/50 text-gray-500 border-white/10 hover:bg-gray-800"
                    }`}
                >
                  Global
                </button>
                {PRIORITY_LEVELS.map((priority) => {
                  const Icon = priority.icon;
                  return (
                    <button
                      key={priority.level}
                      onClick={() => setSelectedPriority(priority.level)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all text-xs tracking-widest uppercase border ${selectedPriority === priority.level
                          ? `${priority.bgColor} ${priority.textColor} ${priority.borderColor} ${priority.glow}`
                          : "bg-gray-900/50 text-gray-500 border-white/10 hover:bg-gray-800"
                        }`}
                    >
                      <Icon size={14} className={selectedPriority === priority.level ? priority.textColor : "text-gray-500"} />
                      <span className="hidden sm:inline">{priority.label}</span>
                      <span className="sm:hidden">Lvl {priority.level}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 shadow-2xl transition-all">
            <div className="dash-glass rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slideIn border-fuchsia-500/20">
              <div className="sticky top-0 bg-gray-900/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-fuchsia-900/30 border border-fuchsia-500/30 rounded-xl">
                    <Sparkles className="text-fuchsia-400 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-200">
                    {editingFriend ? "Modify Profile" : "Register Connection"}
                  </h2>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-white/10"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2"
                  >
                    Designation *
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Protocol Omega"
                    className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-fuchsia-500/50 text-sm sm:text-base placeholder-gray-600"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2"
                  >
                    Comms Frequency
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +1 555..."
                    className="w-full px-4 py-3 sm:py-3.5 dash-input rounded-xl focus:ring-1 focus:ring-fuchsia-500/50 text-sm sm:text-base placeholder-gray-600"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                    Profile Image
                  </label>
                  <CloudinaryUpload
                    currentUrl={form.image_url}
                    label="Upload Profile Photo"
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                  />
                </div>

                {/* Meet Goal */}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">
                    Meet Frequency Goal
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MEET_GOALS.map(g => (
                      <button key={g.value} type="button"
                        onClick={() => setForm({ ...form, meet_goal: g.value })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                          form.meet_goal === g.value
                            ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50"
                            : "bg-gray-900/40 text-gray-500 border-white/10 hover:bg-gray-800"
                        }`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-3">
                    Clearance Level *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRIORITY_LEVELS.map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = form.priority_level === priority.level;
                      return (
                        <button
                          key={priority.level}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, priority_level: priority.level })
                          }
                          className={`relative p-4 rounded-xl border transition-all text-left overflow-hidden group ${isSelected
                              ? `bg-gray-900/60 ${priority.borderColor} ${priority.glow}`
                              : "bg-gray-900/30 border-white/5 hover:border-white/20"
                            }`}
                        >
                          {isSelected && <div className={`absolute inset-0 bg-gradient-to-br ${priority.color} opacity-5`}></div>}
                          <div className="flex items-start gap-3 relative z-10">
                            <div
                              className={`p-2 rounded-lg border ${isSelected
                                  ? `${priority.bgColor} ${priority.borderColor}`
                                  : "bg-gray-800 border-white/5"
                                }`}
                            >
                              <Icon
                                className={`${isSelected ? priority.textColor : "text-gray-500"
                                  }`}
                                size={20}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4
                                  className={`font-bold text-sm sm:text-base ${isSelected
                                      ? priority.textColor
                                      : "text-gray-300"
                                    }`}
                                >
                                  {priority.label}
                                </h4>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full border border-fuchsia-500/50 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_5px_#d946ef]"></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-mono tracking-wider text-gray-500">
                                {priority.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900/50 text-gray-400 border border-white/10 rounded-xl font-semibold hover:bg-gray-800 transition-all text-xs tracking-widest uppercase"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.name.trim()}
                    className="flex-1 py-3.5 sm:py-4 dash-btn rounded-xl font-semibold shadow-[0_0_15px_rgba(217,70,239,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 text-xs tracking-widest uppercase transition-all"
                  >
                    {loading
                      ? "Synchronizing..."
                      : editingFriend
                        ? "Apply Patch"
                        : "Establish Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Friends List */}
        {loading && friends.length === 0 ? (
          <div className="flex justify-center py-16 sm:py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div>
              <div className="text-fuchsia-400 font-mono text-xs tracking-widest uppercase animate-pulse">Scanning Network...</div>
            </div>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20 px-4 dash-glass rounded-3xl mt-6">
            <div className="inline-flex p-6 sm:p-8 bg-gray-900/50 border border-white/5 rounded-3xl mb-4 sm:mb-6">
              <Users className="text-gray-600 w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-300 mb-2 sm:mb-3">
              {searchQuery || selectedPriority
                ? "No Matches Found"
                : "Empty Directory"}
            </h3>
            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-6 sm:mb-8 max-w-md mx-auto">
              {searchQuery || selectedPriority
                ? "Modify query parameters"
                : "Awaiting initial node connections"}
            </p>
            {!searchQuery && !selectedPriority && (
              <button
                onClick={() => {
                  resetForm();
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 dash-btn rounded-xl font-bold transition-all hover:scale-105 text-xs uppercase tracking-widest"
              >
                <UserPlus size={16} className="sm:w-4 sm:h-4" />
                Initialize First Link
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {PRIORITY_LEVELS.map((priority) => {
              const friendsInPriority = groupedFriends[priority.level] || [];
              if (friendsInPriority.length === 0) return null;

              const Icon = priority.icon;

              return (
                <div key={priority.level} className="relative">
                  <div className={`absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b ${priority.color} rounded-r-full opacity-50`}></div>
                  {/* Priority Header */}
                  <div className="flex items-center gap-4 mb-6 sm:mb-8 pl-2">
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl border ${priority.bgColor} ${priority.borderColor} ${priority.glow}`}
                    >
                      <Icon className={`${priority.textColor} w-5 h-5 sm:w-6 sm:h-6`} />
                    </div>
                    <div>
                      <h3 className={`text-xl sm:text-2xl font-black ${priority.textColor} tracking-wide uppercase`}>
                        {priority.label} <span className="text-gray-600 ml-2">[{friendsInPriority.length}]</span>
                      </h3>
                      <div className="w-16 h-1 mt-1 bg-gradient-to-r ${priority.color} opacity-30 rounded-full"></div>
                    </div>
                  </div>

                  {/* Friends Grid */}
                  <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pl-2">
                    {friendsInPriority.map((friend) => (
                      <div
                        key={friend.id}
                        className={`group dash-glass rounded-2xl overflow-hidden border ${priority.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:${priority.glow}`}
                      >
                        <div className="p-5 sm:p-6 relative">
                          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10 ${priority.textColor}`}>
                            <Icon size={64} />
                          </div>

                          {/* Friend Header */}
                          <div className="flex items-start gap-4 mb-5 relative z-10">
                            {/* Avatar */}
                            <div
                              className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center overflow-hidden border ${priority.borderColor} ${priority.bgColor} shadow-lg group-hover:scale-105 transition-transform`}
                            >
                              {friend.image_url ? (
                                <img
                                  src={friend.image_url}
                                  alt={friend.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className={`text-xl sm:text-2xl font-black ${priority.textColor}`}>
                                  {friend.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Name and Priority */}
                            <div className="flex-1 min-w-0 pt-1">
                              <h4 className="text-lg sm:text-xl font-bold text-gray-200 mb-1 truncate group-hover:text-[#3D52A0] transition-colors">
                                {friend.name}
                              </h4>
                              <div
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${priority.bgColor} ${priority.borderColor} ${priority.textColor} text-[10px] font-mono tracking-widest uppercase shadow-sm`}
                              >
                                <Icon size={10} />
                                <span>
                                  Lvl {priority.level}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Phone */}
                          {friend.phone && (
                            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-900/40 rounded-xl border border-white/5 relative z-10">
                              <div className="p-1.5 bg-gray-800 rounded-md border border-gray-700">
                                <Phone className="text-gray-400" size={14} />
                              </div>
                              <a
                                href={`tel:${friend.phone}`}
                                className="text-sm font-mono text-gray-300 hover:text-cyan-400 transition-colors truncate tracking-wide"
                              >
                                {friend.phone}
                              </a>
                            </div>
                          )}

                          {/* Last Contacted Badge */}
                          <div className="flex items-center gap-2 mb-4 relative z-10">
                            {(() => {
                              const days = daysSinceContact(friend);
                              const overdue = isOverdue(friend);
                              return (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider border ${
                                  overdue
                                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                                    : days === null
                                    ? "bg-gray-800/60 border-white/5 text-gray-500"
                                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                }`}>
                                  {overdue ? <AlertCircle size={10} /> : days === null ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                  {days === null ? "Never contacted" : days === 0 ? "Contacted today" : `${days}d ago`}
                                </div>
                              );
                            })()}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border bg-gray-800/40 border-white/5 text-gray-500">
                              <Target size={10} />
                              {friend.meet_goal || "monthly"}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-4 border-t border-white/5 relative z-10 space-y-2">
                            <div className="flex gap-2">
                              <button onClick={() => logContact(friend)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold hover:bg-emerald-500/20 transition-all text-xs tracking-widest uppercase">
                                <CheckCircle2 size={13} />
                                <span>Log Contact</span>
                              </button>
                              <button onClick={() => setGoalModal(friend)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-xl font-semibold hover:bg-violet-500/20 transition-all text-xs tracking-widest uppercase">
                                <Target size={13} />
                                <span>Set Goal</span>
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setTipsModal(friend)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl font-semibold hover:bg-cyan-500/20 transition-all text-xs tracking-widest uppercase">
                                <MessageCircle size={13} />
                                <span>Reconnect Tips</span>
                              </button>
                              <button onClick={() => editFriend(friend)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900/60 text-gray-300 border border-white/10 rounded-xl font-semibold hover:bg-gray-800 transition-all text-xs tracking-widest uppercase">
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reconnect Tips Modal */}
      {tipsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="dash-glass rounded-3xl w-full max-w-md border border-cyan-500/20">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-cyan-400" size={18} />
                <span className="text-base font-bold text-gray-200">Reconnect with {tipsModal.name}</span>
              </div>
              <button onClick={() => setTipsModal(null)}><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-3">Conversation starters</p>
              {RECONNECT_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 border border-white/5 hover:border-cyan-500/20 transition-colors group cursor-pointer"
                  onClick={() => { navigator.clipboard?.writeText(tip); }}>
                  <span className="text-[10px] font-mono text-gray-600 mt-0.5 shrink-0">{String(i+1).padStart(2,"0")}</span>
                  <p className="text-sm text-gray-300 group-hover:text-cyan-300 transition-colors">{tip}</p>
                </div>
              ))}
              <p className="text-[10px] text-gray-600 text-center pt-2">Click any tip to copy it</p>
            </div>
          </div>
        </div>
      )}

      {/* Meet Goal Modal */}
      {goalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="dash-glass rounded-3xl w-full max-w-sm border border-violet-500/20">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="text-violet-400" size={18} />
                <span className="text-base font-bold text-gray-200">Meet Goal — {goalModal.name}</span>
              </div>
              <button onClick={() => setGoalModal(null)}><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-3">How often do you want to connect?</p>
              {MEET_GOALS.map(g => {
                const days = daysSinceContact(goalModal);
                const pct = days === null ? 0 : Math.min(100, Math.round((days / g.days) * 100));
                const isCurrent = (goalModal.meet_goal || "monthly") === g.value;
                return (
                  <button key={g.value} onClick={() => saveMeetGoal(goalModal, g.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      isCurrent ? "bg-violet-500/15 border-violet-500/40" : "bg-gray-900/40 border-white/5 hover:border-violet-500/20"
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${isCurrent ? "text-violet-400" : "text-gray-300"}`}>{g.label}</span>
                      <span className="text-[10px] font-mono text-gray-500">every {g.days}d</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        pct >= 100 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{days === null ? "No contact logged yet" : `${pct}% of goal used (${days}d since last contact)`}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}