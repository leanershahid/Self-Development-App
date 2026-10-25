import React, { useState } from 'react';
import { Heart, Star, Sparkles, Coffee, Sun, Zap, Check } from 'lucide-react';
import QuoteManager from './QuoteManager';
import { Card, CardHeader, CardBody, Badge, Tabs, Button, useToast } from './ui';
import { supabase } from '../supabase';

export default function QuoteTabs() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const tabs = [
    {
      id: 0,
      icon: Heart,
      label: 'Motivation',
      color: 'from-fuchsia-500 to-pink-500',
      bgColor: 'bg-fuchsia-500/10',
      textColor: 'text-fuchsia-400',
      quote: 'തോൽക്കുന്നതിനേക്കാൾ നല്ലത് ചത്ത് തോലയുന്നതാ !.. ഇനി നീ സിഗരറ്റ് വലിച്ചാൽ പോയി ചത്ത് തോലയ് , ',
      description: 'There is no more chances for you so do or die.',
      image: 'https://tse2.mm.bing.net/th/id/OIP.scUlGVp2udvDg17EvutY2gHaEK?pid=Api&P=0&h=180'
    },
    {
      id: 1,
      icon: Star,
      label: 'Success',
      color: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      quote: 'Success is not the key to happiness. Happiness is the key to success.',
      author: 'Albert Schweitzer',
      description: 'If you love what you are doing, you will be successful in every aspect of life.',
      image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      icon: Sparkles,
      label: 'Dreams',
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      quote: 'My dream isn’t fame — it’s to write a script that lives longer than me.',
      author: 'Eleanor Roosevelt',
      description: 'Dream big, work hard, stay focused, and surround yourself with good people.',
      image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      icon: Coffee,
      label: 'Life',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      quote: 'Take care of yourself first before taking care of others.Show yourself respect before giving it to others. Value yourself first before valuing others more than you. Moral of the story : treat yourself right first, so you can treat others better.',
      author: 'Vibezone',
      description: 'Be best version of yourself',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      icon: Sun,
      label: 'Happiness',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      quote: 'I don’t need smoke or drinks to feel alive.',
      description: 'The most important thing is to enjoy your life, to be happy, it\'s all that matters.',
      image: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      icon: Zap,
      label: 'Energy',
      color: 'from-rose-400 to-red-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      quote: 'I just want to speak with the people I love, without judgment, without hurting, without becoming a burden.',
      author: 'Benjamin Franklin',
      description: 'The energy of the mind is the essence of life. Keep your energy positive and focused.',
      image: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&h=300&fit=crop'
    }
  ];

  const activeContent = tabs[activeTab];
  const Icon = activeContent.icon;
  const isSaved = savedIds.has(activeContent.id);

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('quotes').insert([{
        quote_text: activeContent.quote,
        author: activeContent.author || null,
        category: activeContent.label.toLowerCase(),
        source: 'internet',
      }]);
      if (error) throw error;
      setSavedIds((prev) => new Set(prev).add(activeContent.id));
      toast.success('Saved to your Quote Registry!');
    } catch (error) {
      toast.error('Failed to save quote: ' + error.message);
    }
    setSaving(false);
  };

  const handleShare = async () => {
    const shareText = `"${activeContent.quote}"${activeContent.author ? ` — ${activeContent.author}` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Quote copied to clipboard!');
    } catch {
      toast.error('Could not copy quote to clipboard');
    }
  };

  const tabItems = tabs.map((tab) => {
    const TabIcon = tab.icon;
    return {
      value: tab.id,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <TabIcon size={14} strokeWidth={2} />
          {tab.label}
        </span>
      ),
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <QuoteManager />

      <Card>
        <CardHeader
          icon={<Sparkles size={18} strokeWidth={2} />}
          title="Daily Inspiration"
          subtitle="Pick a theme to calibrate your mindset"
        />

        <div className="px-5 pt-4 overflow-x-auto">
          <Tabs tabs={tabItems} value={activeTab} onChange={setActiveTab} />
        </div>

        <CardBody>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-56 md:h-full rounded-lg overflow-hidden border border-[var(--border)]">
              <img
                src={activeContent.image}
                alt={activeContent.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-primary shadow-sm">
                <Icon size={20} strokeWidth={2} />
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <div>
                <Badge variant="primary">{activeContent.label}</Badge>
              </div>

              <p className="text-lg font-medium text-[var(--text)] leading-relaxed">
                "{activeContent.quote}"
              </p>

              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {activeContent.description}
              </p>

              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                — {activeContent.author || 'Unknown'}
              </p>

              <div className="flex gap-3 pt-4 border-t border-[var(--border)] mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={isSaved ? <Check size={14} /> : undefined}
                  disabled={isSaved || saving}
                  onClick={handleSave}
                >
                  {isSaved ? 'Saved' : saving ? 'Saving…' : 'Save Quote'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleShare}>Share</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
