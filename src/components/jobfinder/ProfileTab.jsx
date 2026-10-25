import React from 'react';
import { User, FileText, Loader2, Upload } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Textarea, Button } from '../ui';

export default function ProfileTab({
  profileForm, setProfileForm,
  resumeUrl, setResumeUrl,
  extractingPdf, extractPdfText,
  savingProfile, saveProfile,
}) {
  return (
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
  );
}
