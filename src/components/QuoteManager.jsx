import React, { useState, useEffect } from 'react';
import { Quote, Plus, Trash2, Edit2, Check, X, Star, BookOpen, Film, Music, User, Sparkles } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function QuoteManager() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    quote_text: '',
    author: '',
    category: 'motivation',
    mood: 'calm',
    language: 'en',
    source: 'personal',
    is_featured: false
  });

  const categories = ['motivation', 'travel', 'life', 'success', 'wisdom', 'love'];
  const moods = ['calm', 'intense', 'happy', 'sad', 'inspiring', 'peaceful'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' }
  ];
  const sources = ['book', 'movie', 'personal', 'song', 'speech', 'internet'];

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error loading quotes:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.quote_text.trim()) {
      alert('Quote text is required!');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('quotes')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        setQuotes(quotes.map(q => q.id === editingId ? { ...q, ...formData } : q));
        setEditingId(null);
      } else {
        const { data, error } = await supabase
          .from('quotes')
          .insert([formData])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setQuotes([data[0], ...quotes]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving quote:", error);
      alert('Failed to save quote: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setQuotes(quotes.filter(q => q.id !== id));
    } catch (error) {
      console.error("Error deleting quote:", error);
      alert('Failed to delete quote');
    }
  };

  const handleEdit = (quote) => {
    setFormData({
      quote_text: quote.quote_text,
      author: quote.author || '',
      category: quote.category || 'motivation',
      mood: quote.mood || 'calm',
      language: quote.language || 'en',
      source: quote.source || 'personal',
      is_featured: quote.is_featured || false
    });
    setEditingId(quote.id);
    setShowForm(true);
  };

  const toggleFeatured = async (quote) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_featured: !quote.is_featured })
        .eq('id', quote.id);

      if (error) throw error;

      setQuotes(quotes.map(q =>
        q.id === quote.id ? { ...q, is_featured: !q.is_featured } : q
      ));
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      quote_text: '',
      author: '',
      category: 'motivation',
      mood: 'calm',
      language: 'en',
      source: 'personal',
      is_featured: false
    });
    setEditingId(null);
  };

  const getSourceIcon = (source) => {
    const icons = {
      book: <BookOpen size={14} />,
      movie: <Film size={14} />,
      song: <Music size={14} />,
      personal: <User size={14} />,
      speech: <Quote size={14} />,
      internet: <Sparkles size={14} />
    };
    return icons[source] || <Quote size={14} />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      motivation: 'text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]',
      travel: 'text-sky-400 bg-sky-400/10 border-sky-400/30 shadow-[0_0_10px_rgba(56,189,248,0.1)]',
      life: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]',
      success: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30 shadow-[0_0_10px_rgba(232,121,249,0.1)]',
      wisdom: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30 shadow-[0_0_10px_rgba(129,140,248,0.1)]',
      love: 'text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_10px_rgba(251,113,133,0.1)]'
    };
    return colors[category] || 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          <div className="text-cyan-400 font-mono text-xs tracking-widest uppercase animate-pulse">Accessing Databanks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slideIn relative z-10" style={{ animationDelay: '0.1s' }}>
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
        .dash-select {
          background-color: rgba(255,255,255,0.55);
          color: #3D52A0;
          border: 1px solid rgba(112,145,230,0.35);
        }
        .dash-select option {
          background-color: #EDE8F5;
          color: #3D52A0;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        {/* Header Section (Internal to Manager) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 mt-12 pt-8 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-gray-900/50">
              <Quote size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tight">
                Quote Registry
              </h2>
              <p className="text-cyan-400/60 font-mono text-xs tracking-widest uppercase mt-1">
                Manage Textual Assets
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="w-full sm:w-auto dash-btn px-6 py-3.5 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Abort Entry' : 'Append Record'}
          </button>
        </div>

        {showForm && (
          <div className="dash-glass rounded-3xl p-6 sm:p-8 mb-10 border border-cyan-500/30 animate-slideIn">
            <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/30">
                <Edit2 size={16} />
              </div>
              {editingId ? 'Modify Record' : 'Initialize New Entry'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Quote Content *</label>
                <textarea
                  value={formData.quote_text}
                  onChange={(e) => setFormData({ ...formData, quote_text: e.target.value })}
                  rows={4}
                  placeholder="Input text block..."
                  className="w-full px-4 py-3 dash-input rounded-xl text-sm sm:text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Source Origin (Author)</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g., entity name"
                    className="w-full px-4 py-3 dash-input rounded-xl text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Classification</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 dash-select rounded-xl text-sm sm:text-base appearance-none bg-gray-900/50"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Emotional Vector</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-4 py-3 dash-select rounded-xl text-sm sm:text-base appearance-none bg-gray-900/50"
                  >
                    {moods.map(mood => (
                      <option key={mood} value={mood}>{mood.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Syntax Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-3 dash-select rounded-xl text-sm sm:text-base appearance-none bg-gray-900/50"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2">Media Origin</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 dash-select rounded-xl text-sm sm:text-base appearance-none bg-gray-900/50"
                  >
                    {sources.map(src => (
                      <option key={src} value={src}>{src.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border border-white/20 bg-gray-900/50 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 flex items-center justify-center transition-colors">
                      <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 group-hover:text-cyan-400 transition-colors">Flag as Priority (Featured)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-gray-900/50 text-gray-400 border border-white/10 rounded-xl font-semibold hover:bg-gray-800 transition-all text-xs tracking-widest uppercase order-2 sm:order-1"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto flex-1 dash-btn px-8 py-4 rounded-xl text-xs font-semibold tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] order-1 sm:order-2"
                >
                  {editingId ? 'Compile Changes' : 'Execute Injection'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dash-glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <h2 className="text-xl font-bold text-gray-200">Database Entries <span className="text-cyan-500/60 font-mono text-xs ml-2">[{quotes.length}]</span></h2>
          </div>

          {quotes.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-900/30 rounded-2xl border border-white/5">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-700">
                <Quote className="text-gray-500" size={24} />
              </div>
              <p className="text-gray-300 font-bold text-xl mb-2">Registry Void</p>
              <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase max-w-sm mx-auto">Click "Append Record" to ingest textual data into the mainframe</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-5 sm:p-6 bg-gray-900/60 rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-mono tracking-widest uppercase border ${getCategoryColor(quote.category)}`}>
                        {quote.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[9px] font-mono tracking-widest uppercase bg-gray-800 border border-gray-700 text-gray-400 flex items-center gap-1.5 hover:border-gray-500 transition-colors">
                        {getSourceIcon(quote.source)}
                        {quote.source}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[9px] font-mono tracking-widest uppercase bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors">
                        M: {quote.mood}
                      </span>
                      {quote.is_featured && (
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-mono tracking-widest uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                          <Star size={10} className="fill-amber-400" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-base sm:text-lg text-gray-300 font-light mb-4 leading-relaxed group-hover:text-[#3D52A0] transition-colors relative z-10">"{quote.quote_text}"</p>

                    {quote.author && (
                      <p className="text-xs font-mono tracking-widest uppercase text-cyan-500/80 mb-4">— {quote.author}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-mono text-gray-600">
                      ID: {String(quote.id).substring(0, 8)} | {' '}
                      {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFeatured(quote)}
                        className={`p-2 rounded-lg transition-all border ${quote.is_featured
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-amber-400'
                          }`}
                        title={quote.is_featured ? "Nullify Priority" : "Elevate Priority"}
                      >
                        <Star size={14} className={quote.is_featured ? 'fill-amber-400' : ''} />
                      </button>
                      <button
                        onClick={() => handleEdit(quote)}
                        className="p-2 bg-gray-800 text-cyan-400 border border-gray-700 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                        title="Configure Record"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="p-2 bg-gray-800 text-rose-400 border border-gray-700 rounded-lg hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                        title="Eradicate Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}