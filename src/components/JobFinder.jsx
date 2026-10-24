import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../supabase';
import CloudinaryUpload from './CloudinaryUpload';
import { showLocalNotification } from '../utils/pushNotifications';
import { Search, Briefcase, MapPin, DollarSign, ExternalLink, Plus, Check, Trash2, Edit2, ChevronDown, Loader2, Sparkles, Bell, FileText, User, Upload, Zap } from 'lucide-react';
import {
  Button, IconButton, Input, Textarea, Select, Card, CardHeader, CardBody, Badge,
  KpiCard, Table, Modal, ConfirmDialog, Tabs, EmptyState, useToast,
} from './ui';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const JSEARCH_KEY = 'e97052a32amshadf58619b98d360p1aac85jsn8fcaa219a060';
const GROQ_KEY = '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';
const SUPABASE_URL = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';

const sendPushNotification = async (title, body) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/job-apply-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ title, body, url: '/job-finder' }),
    });
    if (!res.ok) console.error('Push failed:', res.status, await res.text());
  } catch (e) { console.error('Push error:', e.message); }
};

const STATUS_META = {
  saved:      { label: 'Saved', variant: 'primary' },
  applied:    { label: 'Applied', variant: 'info' },
  interview:  { label: 'Interview', variant: 'warning' },
  offer:      { label: 'Offer', variant: 'success' },
  rejected:   { label: 'Rejected', variant: 'danger' },
};

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 800 }),
  });
  const json = await res.json();
  return json.choices[0].message.content;
}

export default function JobFinder() {
  const toast = useToast();
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [savingJob, setSavingJob] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [autoApplyingAll, setAutoApplyingAll] = useState(false);
  const [autoApplyProgress, setAutoApplyProgress] = useState({ current: 0, total: 0, currentJob: '' });
  const [useAiCoverLetter, setUseAiCoverLetter] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Profile state
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', job_title: '', location: '', resume_text: '', base_cover_letter: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => { loadApplications(); loadProfile(); }, []);

  const loadProfile = async () => {
    const { data } = await supabase.from('user_profile').select('*').limit(1).maybeSingle();
    if (data) {
      setProfile(data);
      setProfileForm(data);
      setQuery(data.job_title || '');
      setLocation(data.location || '');
      setResumeUrl(data.resume_url || '');
    }
  };

  const extractPdfText = async (file) => {
    setExtractingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      setProfileForm(prev => ({ ...prev, resume_text: text.slice(0, 3000) }));
    } catch (e) {
      toast.error('Failed to extract PDF text: ' + e.message);
    }
    setExtractingPdf(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      if (profile?.id) {
        await supabase.from('user_profile').update({ ...profileForm, resume_url: resumeUrl, updated_at: new Date().toISOString() }).eq('id', profile.id);
      } else {
        await supabase.from('user_profile').insert({ ...profileForm, resume_url: resumeUrl });
      }
      await loadProfile();
      toast.success('Profile saved!');
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    }
    setSavingProfile(false);
  };

  const loadApplications = async () => {
    const { data } = await supabase.from('job_applications').select('*').order('created_at', { ascending: false });
    setApplications(data || []);
  };

  const searchJobs = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setJobs([]);
    try {
      const q = location.trim() ? `${query} jobs in ${location}` : `${query} jobs`;
      const res = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=2&date_posted=all`, {
        headers: { 'x-rapidapi-key': JSEARCH_KEY, 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      const seen = new Set();
      const unique = (json.data || []).filter(j => {
        const key = `${j.job_title}|${j.employer_name}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      setJobs(unique);
    } catch (e) {
      toast.error('Search failed: ' + e.message);
    }
    setSearching(false);
  };

  const generateCoverLetter = async (job) => {
    setGeneratingCL(true);
    setCoverLetter('');
    try {
      const prompt = `Write a professional cover letter for this job:
Job Title: ${job.job_title}
Company: ${job.employer_name}
Location: ${job.job_city || ''} ${job.job_country || ''}
Description: ${(job.job_description || '').slice(0, 800)}

${profile?.resume_text ? `My Resume/Skills:\n${profile.resume_text.slice(0, 500)}` : ''}
${profile?.base_cover_letter ? `My Base Cover Letter (customize this):\n${profile.base_cover_letter.slice(0, 400)}` : ''}
${profile?.full_name ? `My Name: ${profile.full_name}` : ''}

Write a compelling, personalized cover letter in 3 paragraphs tailored to this specific job. Be professional and enthusiastic.`;
      const cl = await callGroq(prompt);
      setCoverLetter(cl);
    } catch (e) {
      toast.error('Failed to generate cover letter: ' + e.message);
    }
    setGeneratingCL(false);
  };

  const autoApply = async (job) => {
    // Generate customized cover letter
    let cl = coverLetter;
    if (!cl) {
      setGeneratingCL(true);
      try {
        const prompt = `Write a professional cover letter for this job:
Job Title: ${job.job_title}
Company: ${job.employer_name}
Description: ${(job.job_description || '').slice(0, 600)}
${profile?.resume_text ? `My Resume: ${profile.resume_text.slice(0, 400)}` : ''}
${profile?.full_name ? `My Name: ${profile.full_name}` : ''}
Write a compelling 3-paragraph cover letter.`;
        cl = await callGroq(prompt);
        setCoverLetter(cl);
      } catch { cl = profile?.base_cover_letter || ''; }
      setGeneratingCL(false);
    }
    // Copy cover letter to clipboard
    if (cl) await navigator.clipboard.writeText(cl);
    // Save to tracker
    await saveJob(job, cl);
    // Open job site
    const url = job.job_apply_link || job.job_google_link;
    if (url) window.open(url, '_blank');
    showLocalNotification('🚀 Applying to ' + job.job_title, `at ${job.employer_name} — cover letter copied, paste & submit!`);
    toast.success('Cover letter copied to clipboard! Job site opened — paste your cover letter and submit.');
  };

  const saveJob = async (job, cl = coverLetter) => {
    setSavingJob(job.job_id);
    try {
      const { error } = await supabase.from('job_applications').insert({
        job_title: job.job_title,
        company: job.employer_name,
        location: `${job.job_city || ''} ${job.job_country || ''}`.trim(),
        salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || ''}` : null,
        job_url: job.job_apply_link || job.job_google_link,
        description: (job.job_description || '').slice(0, 1000),
        status: 'saved',
        cover_letter: cl || null,
      });
      if (error) throw error;
      await loadApplications();
      showLocalNotification('💼 Job Saved!', `${job.job_title} at ${job.employer_name} added to tracker`);
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    }
    setSavingJob(null);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('job_applications').update({ status, applied_at: status === 'applied' ? new Date().toISOString().split('T')[0] : undefined }).eq('id', id);
    const app = applications.find(a => a.id === id);
    const msgs = {
      applied:   { title: '📨 Application Sent!',   body: `${app?.job_title} at ${app?.company}` },
      interview: { title: '🎯 Interview Scheduled!', body: `${app?.job_title} at ${app?.company} — prepare well!` },
      offer:     { title: '🎉 Job Offer Received!',  body: `${app?.job_title} at ${app?.company} — congratulations!` },
      rejected:  { title: '💪 Keep Going!',          body: `${app?.company} rejected — more opportunities ahead!` },
    };
    if (msgs[status]) showLocalNotification(msgs[status].title, msgs[status].body);
    await loadApplications();
  };

  const updateNotes = async (id) => {
    await supabase.from('job_applications').update({ notes }).eq('id', id);
    setEditingApp(null);
    await loadApplications();
  };

  const deleteApp = async (id) => {
    await supabase.from('job_applications').delete().eq('id', id);
    await loadApplications();
  };

  const confirmDeleteApp = async () => {
    if (!deleteTarget) return;
    await deleteApp(deleteTarget.id);
    setDeleteTarget(null);
    toast.success('Application removed');
  };

  const autoApplyAll = async () => {
    if (!jobs.length) return;
    setAutoApplyingAll(true);
    setAutoApplyProgress({ current: 0, total: jobs.length });
    let successCount = 0;
    const errors = [];
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      setAutoApplyProgress({ current: i + 1, total: jobs.length, currentJob: job.job_title });
      try {
        let cl = profile?.base_cover_letter || '';
        if (useAiCoverLetter) {
          try {
            const prompt = `Write a short professional cover letter for:\nJob: ${job.job_title} at ${job.employer_name}\nDescription: ${(job.job_description || '').slice(0, 500)}\n${profile?.full_name ? `Applicant: ${profile.full_name}` : ''}\n${profile?.resume_text ? `Skills: ${profile.resume_text.slice(0, 300)}` : ''}\n3 paragraphs only.`;
            cl = await callGroq(prompt);
          } catch { cl = profile?.base_cover_letter || ''; }
        }
        const { error } = await supabase.from('job_applications').insert({
          job_title: job.job_title,
          company: job.employer_name,
          location: `${job.job_city || ''} ${job.job_country || ''}`.trim(),
          salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency || ''}` : null,
          job_url: job.job_apply_link || job.job_google_link,
          description: (job.job_description || '').slice(0, 1000),
          status: 'applied',
          applied_at: new Date().toISOString().split('T')[0],
          cover_letter: cl || null,
        });
        if (error) throw error;
        successCount++;
        await sendPushNotification(`📨 Applied: ${job.job_title}`, `${job.employer_name} — ${i + 1}/${jobs.length} done`);
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        errors.push(`${job.job_title}: ${e.message}`);
      }
    }
    await loadApplications();
    setAutoApplyingAll(false);
    setAutoApplyProgress({ current: 0, total: 0 });
    if (successCount > 0) {
      showLocalNotification('🚀 Auto Apply Complete!', `Saved ${successCount} jobs — check Applications tab!`);
      sendPushNotification('🚀 Auto Apply Complete!', `Successfully applied to ${successCount}/${jobs.length} jobs!`);
    }
    if (successCount > 0) {
      toast.success(`Saved ${successCount}/${jobs.length} jobs to Applications tab.`);
    }
    if (errors.length) {
      toast.error(`${errors.length} failed: ${errors.slice(0, 3).join('; ')}`);
    }
  };

  const filteredApps = applications
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => !appSearch.trim() || `${a.job_title} ${a.company}`.toLowerCase().includes(appSearch.toLowerCase()));

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
  };

  const editingAppData = applications.find(a => a.id === editingApp) || null;

  const appTableColumns = [
    {
      key: 'job_title',
      header: 'Job',
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <div className="font-medium text-[var(--text)] truncate">{a.job_title}</div>
          <div className="text-xs text-primary truncate">{a.company}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (a) => a.location
        ? <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] whitespace-nowrap"><MapPin size={11} />{a.location}</span>
        : <span className="text-xs text-[var(--text-muted)]">—</span>,
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (a) => a.salary
        ? <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] whitespace-nowrap"><DollarSign size={11} />{a.salary}</span>
        : <span className="text-xs text-[var(--text-muted)]">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_META[a.status]?.variant || 'neutral'}>{STATUS_META[a.status]?.label || a.status}</Badge>
          <Select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} className="!h-8 max-w-[140px] text-xs" onClick={e => e.stopPropagation()}>
            {Object.entries(STATUS_META).map(([s, meta]) => (
              <option key={s} value={s}>{meta.label}</option>
            ))}
          </Select>
        </div>
      ),
    },
    {
      key: 'applied_at',
      header: 'Applied',
      sortable: true,
      render: (a) => a.applied_at
        ? <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] whitespace-nowrap"><Bell size={11} />{a.applied_at}</span>
        : <span className="text-xs text-[var(--text-muted)]">—</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          {a.job_url && (
            <IconButton variant="accent" size="sm" label="Open job listing" onClick={() => window.open(a.job_url, '_blank', 'noreferrer')}>
              <ExternalLink size={13} />
            </IconButton>
          )}
          <IconButton variant="primary" size="sm" label="Edit notes" onClick={() => { setEditingApp(a.id); setNotes(a.notes || ''); }}>
            <Edit2 size={13} />
          </IconButton>
          <IconButton variant="danger" size="sm" label="Delete application" onClick={() => setDeleteTarget(a)}>
            <Trash2 size={13} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
          <Briefcase size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Job Finder</h1>
        <p className="text-sm text-[var(--text-muted)]">Search · AI Cover Letter · Track</p>
      </div>

      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon={<Briefcase size={18} />} label="Saved" value={stats.total} tone="primary" />
          <KpiCard icon={<Bell size={18} />} label="Applied" value={stats.applied} tone="primary" />
          <KpiCard icon={<Sparkles size={18} />} label="Interview" value={stats.interview} tone="warning" />
          <KpiCard icon={<Check size={18} />} label="Offer" value={stats.offer} tone="accent" />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'profile', label: 'My Profile' },
          { value: 'search', label: 'Search Jobs' },
          { value: 'tracker', label: 'Applications' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Personal Info" icon={<User size={16} />} />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input value={profileForm.full_name || ''} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Full Name" />
                <Input value={profileForm.email || ''} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" />
                <Input value={profileForm.phone || ''} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" />
                <Input value={profileForm.job_title || ''} onChange={e => setProfileForm({ ...profileForm, job_title: e.target.value })} placeholder="Target Job Title" />
                <Input value={profileForm.location || ''} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} placeholder="Preferred Location" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Resume (PDF)" icon={<FileText size={16} />} subtitle="Upload your PDF resume — text will be auto-extracted for AI" />
            <CardBody>
              <div className="mb-3">
                <input type="file" accept=".pdf" className="hidden" id="pdf-upload"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    // Upload to Cloudinary
                    const form = new FormData();
                    form.append('file', file);
                    form.append('upload_preset', 'Self-Development');
                    const res = await fetch('https://api.cloudinary.com/v1_1/dk8wc11kq/raw/upload', { method: 'POST', body: form });
                    const data = await res.json();
                    if (data.secure_url) {
                      setResumeUrl(data.secure_url);
                      setProfileForm(prev => ({ ...prev, resume_url: data.secure_url }));
                    }
                    // Extract text
                    await extractPdfText(file);
                  }} />
                <label htmlFor="pdf-upload"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed cursor-pointer transition-all text-sm"
                  style={{ borderColor: resumeUrl ? 'var(--accent, #10B981)' : 'var(--border)' }}>
                  {extractingPdf ? (
                    <span className="flex items-center gap-2 text-[var(--text-muted)]"><Loader2 size={16} className="animate-spin" />Extracting text...</span>
                  ) : resumeUrl ? (
                    <span className="flex items-center gap-2 text-accent"><FileText size={16} />Resume uploaded — click to replace</span>
                  ) : (
                    <span className="flex items-center gap-2 text-[var(--text-muted)]"><Upload size={16} />Upload PDF Resume</span>
                  )}
                </label>
              </div>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View uploaded resume</a>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-2">Or paste manually below:</p>
              <Textarea
                value={profileForm.resume_text || ''}
                onChange={e => setProfileForm({ ...profileForm, resume_text: e.target.value })}
                placeholder="Resume text will appear here after PDF upload, or paste manually..."
                rows={5}
                autoResize={false}
                className="mt-2"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Base Cover Letter" icon={<Upload size={16} />} subtitle="Paste your existing cover letter — AI will customize it for each job" />
            <CardBody>
              <Textarea
                value={profileForm.base_cover_letter || ''}
                onChange={e => setProfileForm({ ...profileForm, base_cover_letter: e.target.value })}
                placeholder="Paste your base cover letter here..."
                rows={8}
                autoResize={false}
              />
            </CardBody>
          </Card>

          <Button variant="primary" size="lg" className="w-full" loading={savingProfile} onClick={saveProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div className="flex flex-col gap-4">
          {/* Profile Warning */}
          {!profile && (
            <Card as="button" onClick={() => setTab('profile')} className="text-left p-4 flex items-center gap-3 border-warning/30 bg-warning/5">
              <User size={16} className="text-warning shrink-0" />
              <p className="text-xs text-warning">Set up your profile with resume + cover letter for better AI results. <span className="underline">Click here →</span></p>
            </Card>
          )}

          {/* Search Bar */}
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  className="flex-1"
                  leadingIcon={<Search size={16} />}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchJobs()}
                  placeholder="Job title, role, skills..."
                />
                <Input
                  leadingIcon={<MapPin size={16} />}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchJobs()}
                  placeholder="Location (optional)"
                />
                <Button variant="primary" icon={<Search size={16} />} loading={searching} disabled={!query.trim()} onClick={searchJobs}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Auto Apply All */}
          {jobs.length > 0 && (
            <Card>
              <CardBody>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text)]">{jobs.length} jobs found</p>
                  <Button variant="success" size="sm" icon={<Zap size={14} />} loading={autoApplyingAll} onClick={autoApplyAll}>
                    {autoApplyingAll ? `Applying ${autoApplyProgress.current}/${autoApplyProgress.total}` : 'Auto Apply All'}
                  </Button>
                </div>
                {/* Cover Letter Mode Toggle */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Cover Letter:</span>
                  <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                    <button onClick={() => setUseAiCoverLetter(false)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${!useAiCoverLetter ? 'bg-primary/10 text-primary' : 'text-[var(--text-muted)]'}`}>
                      Base
                    </button>
                    <button onClick={() => setUseAiCoverLetter(true)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${useAiCoverLetter ? 'bg-warning/10 text-warning' : 'text-[var(--text-muted)]'}`}>
                      <Sparkles size={11} />AI Generated
                    </button>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {useAiCoverLetter ? 'Unique AI letter per job (slower)' : 'Your base cover letter (faster)'}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Job Results */}
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <Card key={job.job_id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {job.employer_logo && (
                        <img src={job.employer_logo} alt={job.employer_name} className="w-10 h-10 rounded-xl object-contain bg-[var(--surface-hover)] p-1 shrink-0" onError={e => e.target.style.display = 'none'} />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--text)] truncate">{job.job_title}</h3>
                        <p className="text-sm text-primary">{job.employer_name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {(job.job_city || job.job_country) && (
                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><MapPin size={11} />{job.job_city}{job.job_city && job.job_country ? ', ' : ''}{job.job_country}</span>
                          )}
                          {job.job_min_salary && (
                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><DollarSign size={11} />{job.job_min_salary} - {job.job_max_salary} {job.job_salary_currency}</span>
                          )}
                          {job.job_employment_type && (
                            <Badge variant="primary">{job.job_employment_type}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {job.job_apply_link && (
                        <IconButton variant="accent" label="Open job listing" onClick={() => window.open(job.job_apply_link, '_blank', 'noreferrer')}>
                          <ExternalLink size={15} />
                        </IconButton>
                      )}
                      <IconButton
                        variant="primary"
                        label="Expand job"
                        onClick={() => { setSelectedJob(selectedJob?.job_id === job.job_id ? null : job); setCoverLetter(''); }}
                      >
                        <ChevronDown size={15} style={{ transform: selectedJob?.job_id === job.job_id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </IconButton>
                    </div>
                  </div>

                  {/* Expanded */}
                  {selectedJob?.job_id === job.job_id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-4">{job.job_description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button variant="success" size="sm" icon={<Zap size={13} />} loading={generatingCL} onClick={() => autoApply(job)}>
                          {generatingCL ? 'Preparing...' : 'Auto Apply'}
                        </Button>
                        <Button variant="secondary" size="sm" icon={<Sparkles size={13} />} loading={generatingCL} onClick={() => generateCoverLetter(job)}>
                          {generatingCL ? 'Generating...' : 'AI Cover Letter'}
                        </Button>
                        <Button variant="primary" size="sm" icon={<Plus size={13} />} loading={savingJob === job.job_id} onClick={() => saveJob(job)}>
                          Save
                        </Button>
                      </div>

                      {/* Cover Letter */}
                      {coverLetter && (
                        <div className="rounded-xl p-4 bg-warning/5 border border-warning/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-warning uppercase tracking-wide flex items-center gap-2"><FileText size={12} />AI Cover Letter</span>
                            <button onClick={() => { navigator.clipboard.writeText(coverLetter); }}
                              className="text-xs text-warning/70 hover:text-warning transition-colors">Copy</button>
                          </div>
                          <p className="text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}

            {!searching && jobs.length === 0 && query && (
              <Card>
                <EmptyState icon={<Briefcase size={20} />} title="No jobs found" message="Try different keywords." />
              </Card>
            )}

            {!searching && jobs.length === 0 && !query && (
              <Card>
                <EmptyState icon={<Search size={20} />} title="Search for jobs" message="Search for jobs above to get started." />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Auto Apply All Overlay */}
      <Modal open={autoApplyingAll} onClose={() => {}} title="Auto Applying...">
        <div className="text-center py-2">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full animate-ping bg-accent/20" />
            <div className="absolute inset-2 rounded-full animate-pulse bg-accent/15 border border-accent/40" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🚀</div>
          </div>
          <p className="text-xs font-medium mb-1" style={{ color: useAiCoverLetter ? 'var(--warning, #f59e0b)' : 'var(--primary, #1E3A5F)' }}>
            {useAiCoverLetter ? '✨ AI Cover Letter per job' : '📄 Base Cover Letter'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-1 truncate px-4">{autoApplyProgress.currentJob}</p>
          <p className="text-accent font-semibold text-sm mb-4">{autoApplyProgress.current} / {autoApplyProgress.total}</p>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden mb-2">
            <div className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(autoApplyProgress.current / autoApplyProgress.total) * 100}%` }} />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">{Math.round((autoApplyProgress.current / autoApplyProgress.total) * 100)}% complete</p>
        </div>
      </Modal>

      {/* Tracker Tab */}
      {tab === 'tracker' && (
        <div className="flex flex-col gap-4">
          {/* Search + Filter */}
          <Input
            leadingIcon={<Search size={15} />}
            value={appSearch}
            onChange={e => setAppSearch(e.target.value)}
            placeholder="Search applications by title or company..."
          />
          <div className="flex gap-2 flex-wrap">
            <button key="all" onClick={() => setFilterStatus('all')} className="transition-opacity hover:opacity-80">
              <Badge variant={filterStatus === 'all' ? 'primary' : 'neutral'}>All</Badge>
            </button>
            {Object.entries(STATUS_META).map(([s, meta]) => (
              <button key={s} onClick={() => setFilterStatus(s)} className="transition-opacity hover:opacity-80">
                <Badge variant={filterStatus === s ? meta.variant : 'neutral'}>{meta.label}</Badge>
              </button>
            ))}
          </div>

          {/* Applications */}
          {filteredApps.length === 0 ? (
            <Card>
              <EmptyState icon={<Briefcase size={20} />} title="No applications yet" message="Search and save jobs to start tracking them here." />
            </Card>
          ) : (
            <Card>
              <Table
                columns={appTableColumns}
                data={filteredApps}
                rowKey={(a) => a.id}
                pageSize={10}
              />
            </Card>
          )}
        </div>
      )}

      {/* Edit Notes Modal */}
      <Modal
        open={!!editingApp}
        onClose={() => setEditingApp(null)}
        title="Application Notes"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingApp(null)}>Cancel</Button>
            <Button variant="success" icon={<Check size={14} />} onClick={() => updateNotes(editingApp)}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {editingAppData?.cover_letter && (
            <div className="p-3 rounded-xl bg-warning/5 border border-warning/15">
              <p className="text-[11px] font-medium text-warning/70 uppercase tracking-wide mb-1">Cover Letter</p>
              <p className="text-xs text-[var(--text-muted)] whitespace-pre-wrap">{editingAppData.cover_letter}</p>
            </div>
          )}
          <Textarea
            label="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            autoResize={false}
            placeholder="Add notes about this application..."
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteApp}
        title="Delete application"
        message={`Remove "${deleteTarget?.job_title}" at ${deleteTarget?.company} from your tracker? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
