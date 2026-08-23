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
import Navbar from "./NavBar";
import CloudinaryUpload from "./CloudinaryUpload";

const supabaseUrl = "https://quufeiwzsgiuwkeyjjns.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PlansPage() {
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

  useEffect(() => {
    fetchPlans();
  }, []);

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
    await fetchPlans();
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('plans').update({ status }).eq('id', id);
    setStatusMenu(null);
    await fetchPlans();
  }

  const STATUS_OPTIONS = [
    { value: 'in_progress', label: 'In Progress', Icon: Clock,        color: '#22d3ee' },
    { value: 'completed',   label: 'Completed',   Icon: CheckCircle2, color: '#4ade80' },
    { value: 'cancelled',   label: 'Cancelled',   Icon: XCircle,      color: '#f87171' },
    { value: 'open',        label: 'Reopen',      Icon: RefreshCw,    color: '#a78bfa' },
  ];

  const getPriorityBadge = (priority) => {
    const styles = {
      1: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      2: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      3: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    };

    const labels = { 1: "High", 2: "Medium", 3: "Low" };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${styles[priority] || styles[3]}`}
      >
        <AlertCircle size={10} className="mr-1" />
        {labels[priority] || "Low"}
      </span>
    );
  };

  const statusIcon = (status) => {
    if (status === "completed")
      return <CheckCircle2 className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={20} />;
    if (status === "cancelled")
      return <XCircle className="text-rose-400 drop-shadow-[0_0_8px_rgba(2fb,113,133,0.5)]" size={20} />;
    return <Clock className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={20} />;
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
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
          outline: none;
        }
        .dash-btn {
          background: linear-gradient(to right, rgba(14, 165, 233, 0.8), rgba(59, 130, 246, 0.8));
          color: white;
          border: 1px solid rgba(14, 165, 233, 0.5);
          transition: all 0.3s ease;
        }
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(14, 165, 233, 1), rgba(59, 130, 246, 1));
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header + Add Button */}
        <div className="text-center mb-10 relative">
          <div className="absolute right-0 top-0 hidden md:block group">
            <button
              onClick={() => setFormOpen(!formOpen)}
              className="dash-btn px-6 py-3 rounded-xl font-semibold flex items-center gap-2 text-xs tracking-widest uppercase transition-all hover:scale-105"
            >
              <Plus size={16} />
              Initialize Plan
            </button>
          </div>

          <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <CalendarDays size={42} strokeWidth={2} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
            Master Schematics
          </h1>
          <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase mb-6 md:mb-0">
            Strategic Objectives & Timelines
          </p>

          <div className="md:hidden mt-6">
            <button
              onClick={() => setFormOpen(!formOpen)}
              className="w-full dash-btn px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
            >
              <Plus size={16} />
              Initialize Plan
            </button>
          </div>
        </div>

        {/* Create Plan Form - Modern dark style */}
        {formOpen && (
          <div className="mb-12 dash-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0 opacity-50"></div>

            <h2 className="text-xl font-bold text-gray-200 mb-8 flex items-center gap-3 pb-4 border-b border-white/5">
              <Plus className="text-cyan-400" size={24} />
              Draft New Outline
            </h2>

            <form onSubmit={createPlan} className="grid gap-6 md:grid-cols-2">
              {/* Title */}
              <div className="relative">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Objective Designation *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Project Alpha Redesign"
                  className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-cyan-500/50"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="relative">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Classification Tag</label>
                <input
                  id="category"
                  type="text"
                  placeholder="e.g. Design, Engineering"
                  className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-cyan-500/50"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="relative md:col-span-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Operational Details</label>
                <textarea
                  id="description"
                  placeholder="Outline the scope and requirements..."
                  rows={3}
                  className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 resize-none focus:ring-1 focus:ring-cyan-500/50"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Priority */}
              <div className="relative">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Threat / Priority Level</label>
                <select
                  id="priority"
                  className="dash-input w-full px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-cyan-500/50"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value={1} className="bg-gray-900">Critical (High)</option>
                  <option value={2} className="bg-gray-900">Elevated (Medium)</option>
                  <option value={3} className="bg-gray-900">Standard (Low)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Commencement</label>
                  <input
                    id="start_date"
                    type="date"
                    className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-cyan-500/50"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Deadline</label>
                  <input
                    id="end_date"
                    type="date"
                    className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-cyan-500/50"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="relative md:col-span-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Cover Image (Optional)</label>
                <CloudinaryUpload
                  currentUrl={form.image_url}
                  label="Upload Cover Image"
                  onUpload={(url) => setForm({ ...form, image_url: url })}
                />
              </div>

              <div className="flex gap-4 mt-6 md:col-span-2 pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={loading || !form.title.trim()}
                  className="flex-[2] py-3.5 bg-gradient-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50 transition-all border border-cyan-500/50"
                >
                  {loading ? "Processing..." : "Submit Schematic"}
                </button>

                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 px-8 py-3.5 bg-gray-900/50 hover:bg-gray-800 text-gray-400 border border-white/10 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                >
                  Abort
                </button>
              </div>
            </form>
          </div>
        )
        }

        {/* Plans Grid */}
        {
          loading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase animate-pulse">Decrypting Schematics...</div>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 dash-glass rounded-3xl mt-8">
              <div className="inline-flex items-center justify-center p-6 bg-gray-900/50 border border-white/5 rounded-3xl mb-6">
                <CalendarDays className="text-gray-600" size={56} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No Active Blueprints</h3>
              <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-8">Deploy initial parameters to commence tracking</p>
              <button
                onClick={() => setFormOpen(true)}
                className="px-8 py-4 dash-btn rounded-xl font-semibold text-xs tracking-widest uppercase"
              >
                Draft Primary Objective
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const cover = plan.plan_images?.find((i) => i.is_cover);

                return (
                  <div
                    key={plan.id}
                    className={`
                    group relative
                    dash-glass
                    rounded-2xl overflow-hidden
                    transition-all duration-500
                    hover:-translate-y-2 hover:border-cyan-500/30 hover:shadow-[0_15px_30px_-5px_rgba(34,211,238,0.15)]
                  `}
                  >
                    {/* Image / Placeholder */}
                    {cover ? (
                      <div className="relative h-48 overflow-hidden border-b border-white/5">
                        <img
                          src={cover.image_url}
                          alt={plan.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-900/50 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)]"></div>
                        <ImageIcon className="text-gray-700 relative z-10" size={48} strokeWidth={1} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-4 relative">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                          {plan.title}
                        </h3>
                        {/* Status button with dropdown */}
                        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setStatusMenu(statusMenu === plan.id ? null : plan.id)}
                            className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                            {statusIcon(plan.status)}
                            <ChevronDown size={12} className="text-slate-500" />
                          </button>
                          {statusMenu === plan.id && (
                            <div className="absolute right-0 top-8 z-50 rounded-xl overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 150, boxShadow: '0 16px 40px rgba(0,0,0,0.8)' }}>
                              {STATUS_OPTIONS.map(({ value, label, Icon: SI, color }) => (
                                <button key={value} onClick={() => updateStatus(plan.id, value)}
                                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-mono tracking-wider transition-colors hover:bg-white/5"
                                  style={{ color }}>
                                  <SI size={13} /> {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-3 min-h-[3rem] font-light leading-relaxed">
                        {plan.description || "No operational details appended."}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                        {plan.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                            <Tag size={10} className="mr-1" />
                            {plan.category}
                          </span>
                        )}
                        {getPriorityBadge(plan.priority)}
                      </div>

                      <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 flex items-center gap-2 pt-3">
                        <CalendarDays size={12} className="text-cyan-500/50" />
                        <span>
                          {plan.start_date ? new Date(plan.start_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : "TBD"}
                          <span className="mx-1 text-gray-600">→</span>
                          {plan.end_date ? new Date(plan.end_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div >
    </div >
  );
}