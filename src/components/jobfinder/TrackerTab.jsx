import React from 'react';
import { Search, Briefcase } from 'lucide-react';
import { Card, Input, Badge, Table, EmptyState } from '../ui';

export default function TrackerTab({
  appSearch, setAppSearch,
  filterStatus, setFilterStatus, STATUS_META,
  filteredApps, appTableColumns,
}) {
  return (
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
  );
}
