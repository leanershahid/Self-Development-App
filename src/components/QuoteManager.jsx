import React, { useState, useEffect } from 'react';
import { Quote, Plus, Trash2, Edit2, Star, BookOpen, Film, Music, User, Sparkles } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  Table, Badge, Modal, ConfirmDialog, Select, Textarea, Input, Switch, RadioGroup,
  Button, IconButton, Card, CardHeader, CardBody, EmptyState, useToast,
} from './ui';

const supabaseUrl = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_VARIANTS = {
  motivation: 'warning',
  travel: 'info',
  life: 'success',
  success: 'primary',
  wisdom: 'neutral',
  love: 'danger',
};

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);

export default function QuoteManager() {
  const toast = useToast();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
      toast.error('Quote text is required!');
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
      toast.error('Failed to save quote: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setQuotes(quotes.filter(q => q.id !== id));
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error('Failed to delete quote');
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

  const columns = [
    {
      key: 'quote_text',
      header: 'Quote',
      render: (q) => (
        <div className="max-w-md">
          <p className="text-sm text-[var(--text)] line-clamp-2">&ldquo;{q.quote_text}&rdquo;</p>
          {q.author && <p className="text-xs text-[var(--text-muted)] mt-1">&mdash; {q.author}</p>}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (q) => <Badge variant={CATEGORY_VARIANTS[q.category] || 'neutral'}>{q.category}</Badge>
    },
    {
      key: 'mood',
      header: 'Mood',
      sortable: true,
      render: (q) => <Badge variant="neutral">{q.mood}</Badge>
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (q) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {getSourceIcon(q.source)}
          {q.source}
        </span>
      )
    },
    {
      key: 'is_featured',
      header: 'Featured',
      sortable: true,
      render: (q) => (
        <IconButton
          label={q.is_featured ? 'Remove from featured' : 'Mark as featured'}
          variant={q.is_featured ? 'accent' : 'default'}
          onClick={() => toggleFeatured(q)}
        >
          <Star size={16} className={q.is_featured ? 'fill-accent text-accent' : ''} />
        </IconButton>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (q) => <span className="text-xs text-[var(--text-muted)]">{new Date(q.created_at).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: '',
      render: (q) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label="Edit quote" onClick={() => handleEdit(q)}>
            <Edit2 size={15} />
          </IconButton>
          <IconButton label="Delete quote" variant="danger" onClick={() => setConfirmDeleteId(q.id)}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          icon={<Quote size={18} />}
          title="Quote Registry"
          subtitle={`${quotes.length} quote${quotes.length === 1 ? '' : 's'}`}
          action={
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add Quote
            </Button>
          }
        />
        <CardBody>
          <Table
            columns={columns}
            data={quotes}
            rowKey={(q) => q.id}
            loading={loading}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<Quote size={24} />}
                title="No quotes yet"
                message='Click "Add Quote" to create your first quote.'
              />
            }
          />
        </CardBody>
      </Card>

      <Modal
        open={showForm}
        onClose={() => {
          resetForm();
          setShowForm(false);
        }}
        title={editingId ? 'Edit Quote' : 'Add Quote'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Save Changes' : 'Add Quote'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Textarea
            label="Quote Text"
            required
            rows={4}
            value={formData.quote_text}
            onChange={(e) => setFormData({ ...formData, quote_text: e.target.value })}
            placeholder="Enter the quote..."
          />

          <Input
            label="Author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="e.g., Maya Angelou"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{capitalize(cat)}</option>
              ))}
            </Select>

            <Select
              label="Language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </Select>

            <Select
              label="Source"
              className="sm:col-span-2"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              {sources.map(src => (
                <option key={src} value={src}>{capitalize(src)}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Mood</label>
            <RadioGroup
              name="mood"
              direction="horizontal"
              value={formData.mood}
              onChange={(value) => setFormData({ ...formData, mood: value })}
              options={moods.map(mood => ({ value: mood, label: capitalize(mood) }))}
            />
          </div>

          <Switch
            label="Featured"
            description="Highlight this quote as a featured entry"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          await handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
