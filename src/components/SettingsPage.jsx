import React, { useState } from 'react';
import { Settings, Lock, Save, Download, FileText, FileSpreadsheet, SunMoon } from 'lucide-react';
import { exportSummaryPDF, exportFinancePDF } from '../utils/exportData';
import { Button, Card, CardHeader, CardBody, Switch, useToast } from './ui';
import { useTheme } from '../ThemeStore';

export default function SettingsPage() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('pin_lock_enabled') !== 'false');
  const [timeout, setTimeout_] = useState(() => parseInt(localStorage.getItem('pin_timeout_minutes') || '15'));
  const [exporting, setExporting] = useState(null); // 'summary' | 'finance' | null

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'summary') await exportSummaryPDF();
      else await exportFinancePDF();
    } catch (e) {
      console.error('Export failed:', e);
      toast.error('Export failed: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  const save = () => {
    localStorage.setItem('pin_timeout_minutes', timeout);
    localStorage.setItem('pin_lock_enabled', pinEnabled ? 'true' : 'false');
    toast.success('Settings saved');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Settings size={22} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)]">Configure your app preferences</p>
        </div>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" subtitle="Choose how Self Development looks" icon={<SunMoon size={18} />} />
        <CardBody>
          <Switch
            checked={theme === 'light'}
            onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
            label="Light mode"
            description={theme === 'light' ? 'Bright surfaces, dark text.' : 'Dark surfaces, light text.'}
          />
        </CardBody>
      </Card>

      {/* PIN Lock */}
      <Card>
        <CardHeader title="PIN Lock" subtitle="Protect the app with a PIN after inactivity" icon={<Lock size={18} />} />
        <CardBody className="flex flex-col gap-4">
          <Switch
            checked={pinEnabled}
            onChange={(e) => setPinEnabled(e.target.checked)}
            label="Enable PIN lock"
            description={pinEnabled ? 'A PIN will be required to open the app.' : 'The app will open directly without asking for a PIN.'}
          />

          {pinEnabled && (
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={120}
                  value={timeout}
                  onChange={(e) => setTimeout_(+e.target.value)}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-semibold text-primary w-20 text-right">{timeout} min</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                App re-locks after {timeout} minute{timeout !== 1 ? 's' : ''} of inactivity.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Export Reports */}
      <Card>
        <CardHeader title="Export Reports" subtitle="Download PDF reports of your data" icon={<Download size={18} />} />
        <CardBody className="flex flex-col gap-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Summary Report</p>
              <p className="text-xs text-[var(--text-muted)]">
                Todos · Habits · Mood · Journal · Skills · Books · Plans · Achievements · Fears · Comfort Zone
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<FileText size={16} />}
              loading={exporting === 'summary'}
              disabled={!!exporting}
              onClick={() => handleExport('summary')}
            >
              {exporting === 'summary' ? 'Generating...' : 'Download Summary PDF'}
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Finance Report</p>
              <p className="text-xs text-[var(--text-muted)]">
                P&amp;L Summary · Month-by-Month · Category Ledger · Full Transaction Ledger · Shopping Plan
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<FileSpreadsheet size={16} />}
              loading={exporting === 'finance'}
              disabled={!!exporting}
              onClick={() => handleExport('finance')}
            >
              {exporting === 'finance' ? 'Generating...' : 'Download Finance PDF'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Save */}
      <Button variant="primary" size="lg" icon={<Save size={18} />} onClick={save} className="w-full">
        Save Settings
      </Button>
    </div>
  );
}
