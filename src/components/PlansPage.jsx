import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Image as ImageIcon,
  CalendarDays,
  Tag,
  AlertCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import CloudinaryUpload from "./CloudinaryUpload";
import {
  Card,
  CardBody,
  Badge,
  Button,
  Input,
  DateField,
  Textarea,
  Select,
  Modal,
  EmptyState,
  SkeletonCard,
  useToast,
} from "./ui";

const supabaseUrl = "https://qwjujuvtfqahapohhfzs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PlansPage() {
  const toast = useToast();

  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [statusMenu, setStatusMenu] = useState(null); // plan id with open menu

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: 3,
    start_date: "",
    end_date: "",
    image_url: "",
  });

  async function fetchPlans() {
    setLoading(true);
    const { data } = await supabase
      .from("plans")
      .select(`
        *,
        plan_images (
          image_url,
          is_cover
        )
      `)
      .order("created_at", { ascending: false });

    setPlans(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function createPlan(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);

    const { data: plan, error } = await supabase
      .from("plans")
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        priority: form.priority,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to create plan.");
      setLoading(false);
      return;
    }

    if (form.image_url.trim()) {
      await supabase.from("plan_images").insert({
        plan_id: plan.id,
        image_url: form.image_url.trim(),
        is_cover: true,
      });
    }

    setForm({
      title: "",
      description: "",
      category: "",
      priority: 3,
      start_date: "",
      end_date: "",
      image_url: "",
    });

    setFormOpen(false);
    toast.success("Plan created.");
    await fetchPlans();
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('plans').update({ status }).eq('id', id);
    setStatusMenu(null);
    await fetchPlans();
  }

  const STATUS_OPTIONS = [
    { value: 'in_progress', label: 'In Progress', Icon: Clock,        className: 'text-info' },
    { value: 'completed',   label: 'Completed',   Icon: CheckCircle2, className: 'text-accent' },
    { value: 'cancelled',   label: 'Cancelled',   Icon: XCircle,      className: 'text-danger' },
    { value: 'open',        label: 'Reopen',      Icon: RefreshCw,    className: 'text-secondary' },
  ];

  const PRIORITY_INFO = {
    1: { variant: 'danger', label: 'High' },
    2: { variant: 'warning', label: 'Medium' },
    3: { variant: 'info', label: 'Low' },
  };

  const getPriorityBadge = (priority) => {
    const info = PRIORITY_INFO[priority] || PRIORITY_INFO[3];
    return (
      <Badge variant={info.variant}>
        <AlertCircle size={10} />
        {info.label}
      </Badge>
    );
  };

  const statusIcon = (status) => {
    if (status === "completed")
      return <CheckCircle2 className="text-accent" size={20} />;
    if (status === "cancelled")
      return <XCircle className="text-danger" size={20} />;
    return <Clock className="text-info" size={20} />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Plans</h1>
            <p className="text-sm text-[var(--text-muted)]">Strategic objectives & timelines</p>
          </div>
        </div>

        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
          Add Plan
        </Button>
      </div>

      {/* Create Plan Form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Plan" size="lg">
        <form onSubmit={createPlan} className="grid gap-4 md:grid-cols-2">
          <Input
            id="title"
            label="Title"
            required
            type="text"
            placeholder="e.g. Project Alpha Redesign"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Input
            id="category"
            label="Category"
            type="text"
            placeholder="e.g. Design, Engineering"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <Textarea
            id="description"
            label="Description"
            className="md:col-span-2"
            placeholder="Outline the scope and requirements..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Select
            id="priority"
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
          >
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <DateField
              id="start_date"
              label="Start Date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />

            <DateField
              id="end_date"
              label="End Date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          {/* Cover Image Upload */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">Cover Image (optional)</label>
            <CloudinaryUpload
              currentUrl={form.image_url}
              label="Upload Cover Image"
              onUpload={(url) => setForm({ ...form, image_url: url })}
            />
          </div>

          <div className="flex gap-3 mt-2 md:col-span-2 pt-4 border-t border-[var(--border)]">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
              disabled={loading || !form.title.trim()}
            >
              Create Plan
            </Button>

            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={20} />}
            title="No plans yet"
            message="Create your first plan to start tracking objectives and timelines."
            action={
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
                Add Plan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const cover = plan.plan_images?.find((i) => i.is_cover);

            return (
              <Card key={plan.id} className="overflow-hidden flex flex-col">
                {/* Image / Placeholder */}
                {cover ? (
                  <div className="h-44 overflow-hidden border-b border-[var(--border)]">
                    <img
                      src={cover.image_url}
                      alt={plan.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-[var(--surface-hover)] border-b border-[var(--border)] flex items-center justify-center">
                    <ImageIcon className="text-[var(--text-muted)]" size={40} strokeWidth={1.5} />
                  </div>
                )}

                {/* Content */}
                <CardBody className="flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 leading-tight">
                      {plan.title}
                    </h3>
                    {/* Status button with dropdown */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setStatusMenu(statusMenu === plan.id ? null : plan.id)}
                        className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        {statusIcon(plan.status)}
                        <ChevronDown size={12} />
                      </button>
                      {statusMenu === plan.id && (
                        <div className="absolute right-0 top-8 z-50 min-w-[9.5rem] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] py-1.5 overflow-hidden">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateStatus(plan.id, opt.value)}
                              className={`flex items-center gap-2 w-full px-3.5 py-2 text-xs font-medium text-left transition-colors hover:bg-[var(--surface-hover)] ${opt.className}`}
                            >
                              <opt.Icon size={13} /> {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-3 min-h-[3rem]">
                    {plan.description || "No description added."}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border)]">
                    {plan.category && (
                      <Badge variant="neutral">
                        <Tag size={10} />
                        {plan.category}
                      </Badge>
                    )}
                    {getPriorityBadge(plan.priority)}
                  </div>

                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 pt-1">
                    <CalendarDays size={12} />
                    <span>
                      {plan.start_date ? new Date(plan.start_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : "TBD"}
                      <span className="mx-1">&rarr;</span>
                      {plan.end_date ? new Date(plan.end_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : "TBD"}
                    </span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
