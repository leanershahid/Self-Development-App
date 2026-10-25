import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs } from './ui';
import DailyJournal from './DailyJournal';
import MirrorTalk from './MirrorTalk';
import FearCrusher from './FearCrusher';
import ComfortZone from './ComfortZone';
import PatienceMarker from './PatienceMarker';

// Consolidates 5 previously-separate single-purpose journaling pages (Daily Journal,
// Mirror Talk, Fear Crusher, Comfort Zone, Patience Marker) into one tabbed
// "Reflections" page. Each tab still renders the original component and its own
// Supabase table unchanged (journal_entries, mirror_talk, fear_crusher, comfort_zone,
// patience_logs) — this pass merges navigation/UI only, not the underlying schema,
// so no data migration was needed and nothing about existing entries changes.
const TABS = [
  { value: 'journal', label: 'Journal', Component: DailyJournal },
  { value: 'mirror-talk', label: 'Mirror Talk', Component: MirrorTalk },
  { value: 'fear-crusher', label: 'Fear Crusher', Component: FearCrusher },
  { value: 'comfort-zone', label: 'Comfort Zone', Component: ComfortZone },
  { value: 'patience', label: 'Patience', Component: PatienceMarker },
];

export default function ReflectionsHub() {
  const location = useLocation();
  const initialTab = TABS.some((t) => t.value === location.state?.tab) ? location.state.tab : 'journal';
  const [tab, setTab] = useState(initialTab);
  const Active = TABS.find((t) => t.value === tab)?.Component ?? DailyJournal;

  return (
    <div className="space-y-6">
      <Tabs
        tabs={TABS.map(({ value, label }) => ({ value, label }))}
        value={tab}
        onChange={setTab}
      />
      <Active />
    </div>
  );
}
