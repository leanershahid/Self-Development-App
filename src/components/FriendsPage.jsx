import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { showLocalNotification } from "../utils/pushNotifications";
import {
  Users,
  Star,
  Phone,
  Edit2,
  Search,
  Heart,
  UserPlus,
  Crown,
  Award,
  Zap,
  MessageCircle,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  BookOpen,
} from "lucide-react";

import CloudinaryUpload from "./CloudinaryUpload";
import { Button, Input, Card, CardBody, Badge, Modal, EmptyState, SkeletonCard, Avatar, useToast } from "./ui";

const supabaseUrl = "https://qwjujuvtfqahapohhfzs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tone tokens shared by priority levels, badges and the social guide
const TONE = {
  primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30", dot: "bg-primary" },
  danger: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/30", dot: "bg-danger" },
  warning: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30", dot: "bg-warning" },
  success: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/30", dot: "bg-accent" },
  info: { text: "text-info", bg: "bg-info/10", border: "border-info/30", dot: "bg-info" },
  neutral: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30", dot: "bg-secondary" },
};

const PRIORITY_LEVELS = [
  { level: 1, label: "Best Friend", icon: Crown, variant: "primary", description: "Your closest companions" },
  { level: 2, label: "Close Friend", icon: Heart, variant: "danger", description: "Very important people" },
  { level: 3, label: "Good Friend", icon: Star, variant: "warning", description: "Regular hangout buddies" },
  { level: 4, label: "Friend", icon: Award, variant: "info", description: "Friends you see occasionally" },
  { level: 5, label: "Acquaintance", icon: Zap, variant: "neutral", description: "People you know" },
];

const GUIDE_STEPS = [
  { step: 1, title: "Start Conversation", variant: "primary", tips: ["Smile + simple greeting", "Ask easy questions (name, work, place)", "Don't overthink"] },
  { step: 2, title: "Show Interest", variant: "danger", tips: ["Ask open-ended questions", "Listen carefully", "Maintain eye contact"] },
  { step: 3, title: "Share About Yourself", variant: "warning", tips: ["Talk a little about your interests", "Relate to what they say", "Keep it balanced (not one-sided)"] },
  { step: 4, title: "Find Common Ground", variant: "success", tips: ["Look for shared interests", "Agree or connect on small things", "Use: \"Same here\", \"I like that too\""] },
  { step: 5, title: "Keep It Natural", variant: "info", tips: ["Be yourself", "Don't try to impress", "It's okay to be slightly awkward"] },
  { step: 6, title: "Take Contact", variant: "primary", tips: ["Ask for WhatsApp / Instagram", "Suggest meeting again", "Example: \"Let's catch up sometime\""] },
  { step: 7, title: "Follow Up", variant: "success", tips: ["Send a message later", "Check in casually", "Keep conversations going"] },
  { step: 8, title: "Be Consistent", variant: "danger", tips: ["Talk regularly", "Spend time together", "Build trust slowly"] },
  { step: 9, title: "Accept Reality", variant: "neutral", tips: ["Not everyone will connect", "Focus on people who respond well"] },
];

export default function FriendsPage() {
  const toast = useToast();
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

  async function logContact(friend) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("friends").update({ last_contacted: today }).eq("id", friend.id);
    toast.success(`Logged contact with ${friend.name}`);
    await fetchFriends();
  }

  async function saveMeetGoal(friend, goal) {
    await supabase.from("friends").update({ meet_goal: goal }).eq("id", friend.id);
    setGoalModal(null);
    toast.success("Meet goal updated");
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a name");
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
      toast.error("Error saving friend");
      setLoading(false);
      return;
    }

    toast.success(editingFriend ? "Friend updated" : "Friend added");
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Friends</h1>
            <p className="text-sm text-[var(--text-muted)]">Stay close to the people who matter most</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          Add Friend
        </Button>
      </div>

      {/* How to Make Friends Guide */}
      <Card>
        <button
          onClick={() => setGuideOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--surface-hover)] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">How to Approach New People &amp; Build Close Friends</p>
              <p className="text-xs text-[var(--text-muted)]">9-step social guide</p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-[var(--text-muted)] transition-transform duration-300 shrink-0 ${guideOpen ? "rotate-180" : ""}`}
          />
        </button>

        {guideOpen && (
          <CardBody className="pt-0 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-0">
            {GUIDE_STEPS.map(({ step, title, variant, tips }) => {
              const tone = TONE[variant];
              return (
                <div key={step} className={`rounded-xl p-4 border ${tone.border} ${tone.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold font-mono ${tone.text} bg-[var(--surface)] px-2 py-0.5 rounded-md border ${tone.border}`}>
                      0{step}
                    </span>
                    <h4 className={`text-sm font-semibold ${tone.text}`}>{title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                        <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${tone.dot}`} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardBody>
        )}
      </Card>

      {/* Stats Overview */}
      {friends.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Total</p>
              <Users className="text-primary" size={16} />
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">{stats.total}</p>
          </Card>

          {stats.byPriority.map((priority) => {
            const Icon = priority.icon;
            const tone = TONE[priority.variant];
            return (
              <Card key={priority.level} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide truncate">
                    {priority.label}
                  </p>
                  <Icon className={tone.text} size={16} />
                </div>
                <p className={`text-2xl font-bold ${tone.text}`}>{priority.count}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search and Filter */}
      {friends.length > 0 && (
        <Card>
          <CardBody className="flex flex-col sm:flex-row gap-3">
            <Input
              leadingIcon={<Search size={16} />}
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />

            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedPriority(null)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  selectedPriority === null
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                All
              </button>
              {PRIORITY_LEVELS.map((priority) => {
                const Icon = priority.icon;
                const tone = TONE[priority.variant];
                const active = selectedPriority === priority.level;
                return (
                  <button
                    key={priority.level}
                    type="button"
                    onClick={() => setSelectedPriority(priority.level)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? `${tone.bg} ${tone.border} ${tone.text}`
                        : "bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{priority.label}</span>
                    <span className="sm:hidden">Lvl {priority.level}</span>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Friends List */}
      {loading && friends.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredFriends.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={20} />}
            title={searchQuery || selectedPriority ? "No matches found" : "No friends yet"}
            message={
              searchQuery || selectedPriority
                ? "Try adjusting your search or filter."
                : "Add your first friend to start keeping track of your relationships."
            }
            action={
              !searchQuery && !selectedPriority && (
                <Button
                  variant="primary"
                  icon={<UserPlus size={16} />}
                  onClick={() => {
                    resetForm();
                    setFormOpen(true);
                  }}
                >
                  Add Friend
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {PRIORITY_LEVELS.map((priority) => {
            const friendsInPriority = groupedFriends[priority.level] || [];
            if (friendsInPriority.length === 0) return null;

            const Icon = priority.icon;
            const tone = TONE[priority.variant];

            return (
              <div key={priority.level}>
                {/* Priority Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">
                    {priority.label} <span className="text-[var(--text-muted)] font-normal normal-case">({friendsInPriority.length})</span>
                  </h3>
                </div>

                {/* Friends Grid */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {friendsInPriority.map((friend) => {
                    const days = daysSinceContact(friend);
                    const overdue = isOverdue(friend);
                    const contactVariant = overdue ? "danger" : days === null ? "neutral" : "success";
                    const ContactIcon = overdue ? AlertCircle : days === null ? Clock : CheckCircle2;

                    return (
                      <Card key={friend.id} className="hover:shadow-[var(--shadow-md)] transition-shadow">
                        <CardBody>
                          {/* Friend Header */}
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar src={friend.image_url} name={friend.name} size="lg" />
                            <div className="flex-1 min-w-0 pt-0.5">
                              <h4 className="font-semibold text-[var(--text)] truncate mb-1">{friend.name}</h4>
                              <Badge variant={priority.variant}>
                                <Icon size={10} />
                                {priority.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Phone */}
                          {friend.phone && (
                            <a
                              href={`tel:${friend.phone}`}
                              className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-primary transition-colors"
                            >
                              <Phone size={14} />
                              <span className="truncate">{friend.phone}</span>
                            </a>
                          )}

                          {/* Last Contacted */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant={contactVariant}>
                              <ContactIcon size={10} />
                              {days === null ? "Never contacted" : days === 0 ? "Contacted today" : `${days}d ago`}
                            </Badge>
                            <Badge variant="neutral">
                              <Target size={10} />
                              {friend.meet_goal || "monthly"}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                className="flex-1"
                                icon={<CheckCircle2 size={13} />}
                                onClick={() => logContact(friend)}
                              >
                                Log Contact
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                icon={<Target size={13} />}
                                onClick={() => setGoalModal(friend)}
                              >
                                Set Goal
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                icon={<MessageCircle size={13} />}
                                onClick={() => setTipsModal(friend)}
                              >
                                Tips
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                icon={<Edit2 size={13} />}
                                onClick={() => editFriend(friend)}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={resetForm}
        title={editingFriend ? "Edit Friend" : "Add Friend"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Name"
            required
            placeholder="e.g. Jordan Lee"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="e.g. +1 555..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Profile Image</label>
            <CloudinaryUpload
              currentUrl={form.image_url}
              label="Upload Profile Photo"
              onUpload={(url) => setForm({ ...form, image_url: url })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Meet Frequency Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEET_GOALS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setForm({ ...form, meet_goal: g.value })}
                  className={`py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.meet_goal === g.value
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Priority Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIORITY_LEVELS.map((priority) => {
                const Icon = priority.icon;
                const tone = TONE[priority.variant];
                const isSelected = form.priority_level === priority.level;
                return (
                  <button
                    key={priority.level}
                    type="button"
                    onClick={() => setForm({ ...form, priority_level: priority.level })}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      isSelected ? `${tone.bg} ${tone.border}` : "bg-[var(--surface-hover)] border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? tone.bg : "bg-[var(--surface)]"} border ${isSelected ? tone.border : "border-[var(--border)]"}`}>
                        <Icon size={16} className={isSelected ? tone.text : "text-[var(--text-muted)]"} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm ${isSelected ? tone.text : "text-[var(--text)]"}`}>
                          {priority.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{priority.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || !form.name.trim()}
              loading={loading}
            >
              {editingFriend ? "Save Changes" : "Add Friend"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reconnect Tips Modal */}
      <Modal
        open={!!tipsModal}
        onClose={() => setTipsModal(null)}
        title={tipsModal ? `Reconnect with ${tipsModal.name}` : "Reconnect"}
        size="md"
      >
        {tipsModal && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">Conversation starters</p>
            {RECONNECT_TIPS.map((tip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(tip);
                  toast.success("Copied to clipboard");
                }}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] hover:border-primary/30 transition-colors text-left"
              >
                <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm text-[var(--text)]">{tip}</p>
              </button>
            ))}
            <p className="text-xs text-[var(--text-muted)] text-center pt-2">Click any tip to copy it</p>
          </div>
        )}
      </Modal>

      {/* Meet Goal Modal */}
      <Modal
        open={!!goalModal}
        onClose={() => setGoalModal(null)}
        title={goalModal ? `Meet Goal — ${goalModal.name}` : "Meet Goal"}
        size="sm"
      >
        {goalModal && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">How often do you want to connect?</p>
            {MEET_GOALS.map(g => {
              const days = daysSinceContact(goalModal);
              const pct = days === null ? 0 : Math.min(100, Math.round((days / g.days) * 100));
              const isCurrent = (goalModal.meet_goal || "monthly") === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => saveMeetGoal(goalModal, g.value)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    isCurrent ? "bg-primary/10 border-primary/30" : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${isCurrent ? "text-primary" : "text-[var(--text)]"}`}>{g.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">every {g.days}d</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 100 ? "bg-danger" : pct > 60 ? "bg-warning" : "bg-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {days === null ? "No contact logged yet" : `${pct}% of goal used (${days}d since last contact)`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
