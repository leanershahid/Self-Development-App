import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardBody, DateField, Button, EmptyState } from '../ui';

export default function LedgerFilterTab({
  filterFrom, setFilterFrom, filterTo, setFilterTo,
  ledgerNames, activeLedgers, toggleLedger, setFilterLedgers,
  transactions, matchDate, CHART_COLORS, ledgerFilterIncome, ledgerFilterExpense,
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-info/10 text-info">
          <Filter size={28} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Ledger Filter</h2>
        <p className="text-sm text-[var(--text-muted)]">Select ledgers to see combined totals for a date range.</p>
      </div>

      <Card>
        <CardHeader title="Date Range" icon={<Filter size={16} />} />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <DateField label="From" className="flex-1" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <DateField label="To" className="flex-1" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            {(filterFrom || filterTo) && (
              <div className="flex items-end">
                <Button variant="ghost" icon={<X size={14} />} onClick={() => { setFilterFrom(''); setFilterTo(''); }}>Clear</Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Select Ledgers"
          icon={<Filter size={16} />}
          action={activeLedgers.length > 0 && (
            <Button variant="ghost" size="sm" icon={<X size={12} />} onClick={() => setFilterLedgers([])}>Clear all</Button>
          )}
        />
        <CardBody>
          {ledgerNames.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No ledgers found. Add transactions with categories first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ledgerNames.map(n => {
                const active = activeLedgers.includes(n);
                const txCount = transactions.filter(t => (t.category || '') === n).length;
                return (
                  <button
                    key={n}
                    onClick={() => toggleLedger(n)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {active && <CheckCircle2 size={12} />}
                    {n}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-primary/15' : 'bg-[var(--border)]'}`}>{txCount}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {activeLedgers.length === 0 ? (
        <Card><EmptyState icon={<Filter size={20} />} title="No ledgers selected" message="Select ledgers above to view totals." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLedgers.map((ledger, idx) => {
              const txns = transactions.filter(t => (t.category || '') === ledger && matchDate(t));
              const inc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
              const exp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
              const net = inc - exp;
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return (
                <Card key={ledger} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm truncate" style={{ color }}>{ledger}</h3>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-full">{txns.length} txn{txns.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-muted)]">Income</span>
                      <span className="font-semibold text-accent">₹{inc.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-muted)]">Expense</span>
                      <span className="font-semibold text-danger">₹{exp.toLocaleString()}</span>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-[var(--border)] flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">Net</span>
                      <span className={`font-bold ${net >= 0 ? 'text-primary' : 'text-danger'}`}>₹{net.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {activeLedgers.length > 1 && (
            <Card>
              <CardHeader title={`Combined Total — ${activeLedgers.length} Ledgers`} icon={<Filter size={16} />} />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Income</p>
                    <p className="text-xl font-bold text-accent">₹{ledgerFilterIncome.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Expense</p>
                    <p className="text-xl font-bold text-danger">₹{ledgerFilterExpense.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Net Balance</p>
                    <p className={`text-xl font-bold ${ledgerFilterIncome - ledgerFilterExpense >= 0 ? 'text-primary' : 'text-danger'}`}>
                      ₹{(ledgerFilterIncome - ledgerFilterExpense).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
