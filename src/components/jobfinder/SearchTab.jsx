import React from 'react';
import {
  Search, Briefcase, MapPin, DollarSign, ExternalLink, Plus, ChevronDown, Sparkles, FileText, User, Zap,
} from 'lucide-react';
import { Card, CardBody, Input, Button, Badge, IconButton, EmptyState } from '../ui';

export default function SearchTab({
  profile, onGoToProfile,
  query, setQuery, location, setLocation, searchJobs, searching,
  jobs,
  autoApplyingAll, autoApplyAll, autoApplyProgress,
  useAiCoverLetter, setUseAiCoverLetter,
  selectedJob, setSelectedJob, setCoverLetter, coverLetter,
  generatingCL, autoApply, generateCoverLetter, saveJob, savingJob,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Profile Warning */}
      {!profile && (
        <Card as="button" onClick={onGoToProfile} className="text-left p-4 flex items-center gap-3 border-warning/30 bg-warning/5">
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
  );
}
