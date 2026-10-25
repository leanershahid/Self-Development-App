import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../supabase';
import { showLocalNotification } from '../utils/pushNotifications';
import { Briefcase, MapPin, DollarSign, ExternalLink, Check, Trash2, Edit2, Bell, Sparkles } from 'lucide-react';
import { KpiCard, Select, Badge, IconButton, Tabs, useToast } from './ui';

import ProfileTab from './jobfinder/ProfileTab';
import SearchTab from './jobfinder/SearchTab';
import TrackerTab from './jobfinder/TrackerTab';
import { AutoApplyOverlay, EditNotesModal, DeleteAppDialog } from './jobfinder/JobFinderModals';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const JSEARCH_KEY = import.meta.env.VITE_JSEARCH_API_KEY;
const GROQ_KEY = import.meta.env.VITE_JOBFINDER_GROQ_API_KEY;

const sendPushNotification = async (title, body) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-apply-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
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

      {tab === 'profile' && (
        <ProfileTab
          profileForm={profileForm} setProfileForm={setProfileForm}
          resumeUrl={resumeUrl} setResumeUrl={setResumeUrl}
          extractingPdf={extractingPdf} extractPdfText={extractPdfText}
          savingProfile={savingProfile} saveProfile={saveProfile}
        />
      )}

      {tab === 'search' && (
        <SearchTab
          profile={profile} onGoToProfile={() => setTab('profile')}
          query={query} setQuery={setQuery} location={location} setLocation={setLocation}
          searchJobs={searchJobs} searching={searching}
          jobs={jobs}
          autoApplyingAll={autoApplyingAll} autoApplyAll={autoApplyAll} autoApplyProgress={autoApplyProgress}
          useAiCoverLetter={useAiCoverLetter} setUseAiCoverLetter={setUseAiCoverLetter}
          selectedJob={selectedJob} setSelectedJob={setSelectedJob}
          setCoverLetter={setCoverLetter} coverLetter={coverLetter}
          generatingCL={generatingCL} autoApply={autoApply} generateCoverLetter={generateCoverLetter}
          saveJob={saveJob} savingJob={savingJob}
        />
      )}

      <AutoApplyOverlay
        autoApplyingAll={autoApplyingAll}
        useAiCoverLetter={useAiCoverLetter}
        autoApplyProgress={autoApplyProgress}
      />

      {tab === 'tracker' && (
        <TrackerTab
          appSearch={appSearch} setAppSearch={setAppSearch}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          STATUS_META={STATUS_META}
          filteredApps={filteredApps} appTableColumns={appTableColumns}
        />
      )}

      <EditNotesModal
        editingApp={editingApp} setEditingApp={setEditingApp}
        editingAppData={editingAppData}
        notes={notes} setNotes={setNotes}
        updateNotes={updateNotes}
      />

      <DeleteAppDialog
        deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
        confirmDeleteApp={confirmDeleteApp}
      />
    </div>
  );
}
