import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../supabase';
import Navbar from './NavBar';
import CloudinaryUpload from './CloudinaryUpload';
import { showLocalNotification } from '../utils/pushNotifications';
import { Search, Briefcase, MapPin, DollarSign, ExternalLink, Plus, X, Check, Trash2, Edit2, ChevronDown, Loader2, Sparkles, Bell, FileText, User, Upload, Zap } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const JSEARCH_KEY = 'e97052a32amshadf58619b98d360p1aac85jsn8fcaa219a060';
const GROQ_KEY = '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';
const SUPABASE_URL = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';

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

const GLASS = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

const STATUS_COLORS = {
  saved:      { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)',  text: '#818cf8', label: 'Saved' },
  applied:    { bg: 'rgba(34,211,238,0.15)',  border: 'rgba(34,211,238,0.4)',  text: '#22d3ee', label: 'Applied' },
  interview:  { bg: 'rgba(250,204,21,0.15)',  border: 'rgba(250,204,21,0.4)',  text: '#facc15', label: 'Interview' },
  offer:      { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.4)',  text: '#4ade80', label: 'Offer' },
  rejected:   { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', text: '#f87171', label: 'Rejected' },
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
      alert('Failed to extract PDF text: ' + e.message);
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
      alert('Profile saved!');
    } catch (e) {
      alert('Failed to save: ' + e.message);
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
      alert('Search failed: ' + e.message);
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
      alert('Failed to generate cover letter: ' + e.message);
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
      } catch (e) { cl = profile?.base_cover_letter || ''; }
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
    alert('✅ Cover letter copied to clipboard!\n\nJob site opened — paste your cover letter and submit.');
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
      alert('Failed to save: ' + e.message);
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
          } catch (groqErr) { cl = profile?.base_cover_letter || ''; }
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
    const msg = `✅ Done! Saved ${successCount}/${jobs.length} jobs to Applications tab.${
      errors.length ? `\n\n⚠️ ${errors.length} failed:\n${errors.slice(0, 3).join('\n')}` : ''
    }`;
    // alert(msg);
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 border border-indigo-500/30" style={{ ...GLASS, boxShadow: '0 0 24px rgba(99,102,241,0.2)' }}>
            <Briefcase size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-500 mb-2">JOB FINDER</h1>
          <p className="text-indigo-400/50 font-mono text-xs tracking-[0.3em] uppercase">Search · AI Cover Letter · Track</p>
        </div>

        {/* Stats */}
        {applications.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Saved', value: stats.total, color: '#818cf8' },
              { label: 'Applied', value: stats.applied, color: '#22d3ee' },
              { label: 'Interview', value: stats.interview, color: '#facc15' },
              { label: 'Offer', value: stats.offer, color: '#4ade80' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={GLASS}>
                <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl p-1.5 mb-6" style={GLASS}>
          {[{ id: 'profile', label: 'My Profile', icon: User }, { id: 'search', label: 'Search Jobs', icon: Search }, { id: 'tracker', label: 'Applications', icon: Briefcase }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all"
              style={tab === id
                ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' }
                : { color: '#475569', border: '1px solid transparent' }}>
              <Icon size={15} /><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={GLASS}>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14} />Personal Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[{ key: 'full_name', placeholder: 'Full Name' }, { key: 'email', placeholder: 'Email' }, { key: 'phone', placeholder: 'Phone' }, { key: 'job_title', placeholder: 'Target Job Title' }, { key: 'location', placeholder: 'Preferred Location' }].map(({ key, placeholder }) => (
                  <input key={key} value={profileForm[key] || ''} onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={GLASS}>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FileText size={14} />Resume (PDF)</h3>
              <p className="text-xs text-slate-500 mb-3">Upload your PDF resume — text will be auto-extracted for AI</p>
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
                  style={{ background: 'rgba(255,255,255,0.5)', borderColor: resumeUrl ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.15)', color: resumeUrl ? '#4ade80' : '#64748b' }}>
                  {extractingPdf ? <><Loader2 size={16} className="animate-spin" />Extracting text...</> : resumeUrl ? <><FileText size={16} />Resume uploaded ✓ — click to replace</> : <><Upload size={16} />Upload PDF Resume</>}
                </label>
              </div>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 underline">View uploaded resume</a>
              )}
              {extractingPdf && <p className="text-xs text-amber-400 mt-2">⏳ Extracting text from PDF...</p>}
              <p className="text-xs text-slate-600 mt-2">Or paste manually below:</p>
              <textarea value={profileForm.resume_text || ''} onChange={e => setProfileForm({ ...profileForm, resume_text: e.target.value })}
                placeholder="Resume text will appear here after PDF upload, or paste manually..."
                rows={5} className="w-full mt-2 px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            <div className="rounded-2xl p-5" style={GLASS}>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Upload size={14} />Base Cover Letter</h3>
              <p className="text-xs text-slate-500 mb-3">Paste your existing cover letter — AI will customize it for each job</p>
              <textarea value={profileForm.base_cover_letter || ''} onChange={e => setProfileForm({ ...profileForm, base_cover_letter: e.target.value })}
                placeholder="Paste your base cover letter here..."
                rows={8} className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            <button onClick={saveProfile} disabled={savingProfile}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }}>
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* Search Tab */}
        {tab === 'search' && (
          <div>
            {/* Profile Warning */}
            {!profile && (
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer" onClick={() => setTab('profile')}
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <User size={16} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">Set up your profile with resume + cover letter for better AI results. <span className="underline">Click here →</span></p>
              </div>
            )}

            {/* Search Bar */}
            <div className="rounded-2xl p-4 mb-6" style={GLASS}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJobs()}
                    placeholder="Job title, role, skills..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJobs()}
                    placeholder="Location (optional)"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <button onClick={searchJobs} disabled={searching || !query.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }}>
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Auto Apply All Button */}
            {jobs.length > 0 && (
              <div className="mb-4 rounded-2xl p-4" style={GLASS}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-200">{jobs.length} jobs found</p>
                  <button onClick={autoApplyAll} disabled={autoApplyingAll}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }}>
                    {autoApplyingAll ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {autoApplyingAll ? `Applying ${autoApplyProgress.current}/${autoApplyProgress.total}` : 'Auto Apply All'}
                  </button>
                </div>
                {/* Cover Letter Mode Toggle */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Cover Letter:</span>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={() => setUseAiCoverLetter(false)}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all"
                      style={!useAiCoverLetter
                        ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8' }
                        : { background: 'transparent', color: '#475569' }}>
                      Base
                    </button>
                    <button onClick={() => setUseAiCoverLetter(true)}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1"
                      style={useAiCoverLetter
                        ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }
                        : { background: 'transparent', color: '#475569' }}>
                      <Sparkles size={11} />AI Generated
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {useAiCoverLetter ? 'Unique AI letter per job (slower)' : 'Your base cover letter (faster)'}
                  </span>
                </div>
              </div>
            )}

            {/* Job Results */}
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.job_id} className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {job.employer_logo && (
                          <img src={job.employer_logo} alt={job.employer_name} className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 shrink-0" onError={e => e.target.style.display = 'none'} />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-200 truncate">{job.job_title}</h3>
                          <p className="text-sm text-indigo-400">{job.employer_name}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {(job.job_city || job.job_country) && (
                              <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} />{job.job_city}{job.job_city && job.job_country ? ', ' : ''}{job.job_country}</span>
                            )}
                            {job.job_min_salary && (
                              <span className="flex items-center gap-1 text-xs text-slate-500"><DollarSign size={11} />{job.job_min_salary} - {job.job_max_salary} {job.job_salary_currency}</span>
                            )}
                            {job.job_employment_type && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>{job.job_employment_type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {job.job_apply_link && (
                          <a href={job.job_apply_link} target="_blank" rel="noreferrer"
                            className="p-2 rounded-xl transition-all" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button onClick={() => { setSelectedJob(selectedJob?.job_id === job.job_id ? null : job); setCoverLetter(''); }}
                          className="p-2 rounded-xl transition-all" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                          <ChevronDown size={15} style={{ transform: selectedJob?.job_id === job.job_id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded */}
                    {selectedJob?.job_id === job.job_id && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-4">{job.job_description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <button onClick={() => autoApply(job)} disabled={generatingCL}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                            style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                            {generatingCL ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                            {generatingCL ? 'Preparing...' : 'Auto Apply'}
                          </button>
                          <button onClick={() => generateCoverLetter(job)} disabled={generatingCL}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                            {generatingCL ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                            {generatingCL ? 'Generating...' : 'AI Cover Letter'}
                          </button>
                          <button onClick={() => saveJob(job)} disabled={savingJob === job.job_id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                            {savingJob === job.job_id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            Save
                          </button>
                        </div>

                        {/* Cover Letter */}
                        {coverLetter && (
                          <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} />AI Cover Letter</span>
                              <button onClick={() => { navigator.clipboard.writeText(coverLetter); }}
                                className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors">Copy</button>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!searching && jobs.length === 0 && query && (
                <div className="text-center py-16 rounded-2xl" style={GLASS}>
                  <Briefcase className="text-slate-700 mx-auto mb-3" size={40} />
                  <p className="text-slate-500 font-mono text-sm">No jobs found. Try different keywords.</p>
                </div>
              )}

              {!searching && jobs.length === 0 && !query && (
                <div className="text-center py-16 rounded-2xl" style={GLASS}>
                  <Search className="text-slate-700 mx-auto mb-3" size={40} />
                  <p className="text-slate-500 font-mono text-sm">Search for jobs above to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto Apply All Overlay */}
        {autoApplyingAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}>
            <div className="rounded-3xl p-8 text-center max-w-sm w-full mx-4" style={GLASS}>
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(74,222,128,0.2)' }} />
                <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)' }} />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🚀</div>
              </div>
              <h2 className="text-xl font-black text-[#3D52A0] mb-1">Auto Applying...</h2>
              <p className="text-[10px] font-mono mb-1" style={{ color: useAiCoverLetter ? '#f59e0b' : '#818cf8' }}>
                {useAiCoverLetter ? '✨ AI Cover Letter per job' : '📄 Base Cover Letter'}
              </p>
              <p className="text-xs text-slate-400 mb-1 truncate px-4">{autoApplyProgress.currentJob}</p>
              <p className="text-emerald-400 font-mono text-sm mb-5">{autoApplyProgress.current} / {autoApplyProgress.total}</p>
              <div className="w-full rounded-full overflow-hidden mb-2" style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(autoApplyProgress.current / autoApplyProgress.total) * 100}%`, background: 'linear-gradient(90deg, #4ade80, #22d3ee)' }} />
              </div>
              <p className="text-[10px] text-slate-600 font-mono">{Math.round((autoApplyProgress.current / autoApplyProgress.total) * 100)}% complete</p>
            </div>
          </div>
        )}

        {/* Tracker Tab */}
        {tab === 'tracker' && (
          <div>
            {/* Search + Filter */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                placeholder="Search applications by title or company..."
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex gap-2 flex-wrap mb-6">
              {['all', ...Object.keys(STATUS_COLORS)].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  style={filterStatus === s
                    ? { background: s === 'all' ? 'rgba(255,255,255,0.1)' : STATUS_COLORS[s].bg, border: `1px solid ${s === 'all' ? 'rgba(255,255,255,0.2)' : STATUS_COLORS[s].border}`, color: s === 'all' ? '#3D52A0' : STATUS_COLORS[s].text }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                  {s === 'all' ? 'All' : STATUS_COLORS[s].label}
                </button>
              ))}
            </div>

            {/* Applications */}
            <div className="space-y-4">
              {filteredApps.map(app => (
                <div key={app.id} className="rounded-2xl p-5" style={GLASS}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-200 truncate">{app.job_title}</h3>
                      <p className="text-sm text-indigo-400">{app.company}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {app.location && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} />{app.location}</span>}
                        {app.salary && <span className="flex items-center gap-1 text-xs text-slate-500"><DollarSign size={11} />{app.salary}</span>}
                        {app.applied_at && <span className="flex items-center gap-1 text-xs text-slate-500"><Bell size={11} />Applied {app.applied_at}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.job_url && (
                        <a href={app.job_url} target="_blank" rel="noreferrer"
                          className="p-2 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => { setEditingApp(editingApp === app.id ? null : app.id); setNotes(app.notes || ''); }}
                        className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteApp(app.id)}
                        className="p-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(STATUS_COLORS).map(([s, c]) => (
                      <button key={s} onClick={() => updateStatus(app.id, s)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1"
                        style={app.status === s
                          ? { background: c.bg, border: `1px solid ${c.border}`, color: c.text }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                        {app.status === s && <Check size={10} />}{c.label}
                      </button>
                    ))}
                  </div>

                  {/* Cover Letter Preview */}
                  {app.cover_letter && (
                    <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                      <p className="text-[10px] font-mono text-amber-400/60 uppercase tracking-widest mb-1">Cover Letter</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{app.cover_letter}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {editingApp === app.id && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Add notes about this application..."
                        className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateNotes(app.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                          style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                          <Check size={12} />Save
                        </button>
                        <button onClick={() => setEditingApp(null)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                          <X size={12} />Cancel
                        </button>
                      </div>
                      {app.notes && <p className="text-xs text-slate-500 mt-2">{app.notes}</p>}
                    </div>
                  )}
                </div>
              ))}

              {filteredApps.length === 0 && (
                <div className="text-center py-16 rounded-2xl" style={GLASS}>
                  <Briefcase className="text-slate-700 mx-auto mb-3" size={40} />
                  <p className="text-slate-500 font-mono text-sm">No applications yet. Search and save jobs!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
