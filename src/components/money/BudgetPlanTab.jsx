import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Percent, RefreshCw, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Input, IconButton, Button } from '../ui';

export default function BudgetPlanTab({
  budgetDraft, loadBudgetDraft, clearBudgetDraft,
  budgetSaved, budgetEditMode,
  budgetIncome, updateIncome,
  budgetLedgers, setBudgetLedgers, categories, loadCategoriesIntoBudget,
  updateLedgerAmount, updateLedgerPercent,
  saveBudgetPlan, budgetLoading, cancelEditBudget, saveBudgetDraft,
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-warning/10 text-warning">
          <Wallet size={28} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Budget Plan</h2>
        <p className="text-sm text-[var(--text-muted)]">Split your income into ledgers.</p>
      </div>

      {budgetDraft && (
        <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="neutral">Draft</Badge>
            <span className="text-sm text-[var(--text)]">
              Income: <span className="font-semibold text-warning">₹{Number(budgetDraft.income || 0).toLocaleString()}</span>
              <span className="text-[var(--text-muted)] mx-2">·</span>
              {budgetDraft.ledgers?.filter(l => l.name).length || 0} ledger{(budgetDraft.ledgers?.filter(l => l.name).length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadBudgetDraft}>Load Draft</Button>
            <Button variant="ghost" size="sm" onClick={clearBudgetDraft}>Clear</Button>
          </div>
        </Card>
      )}

      {budgetSaved && (
        <Card>
          <CardHeader
            title="Active Budget Plan"
            icon={<Wallet size={16} />}
            action={<span className="text-sm text-[var(--text-muted)]">Total Income: <span className="font-semibold text-accent">₹{Number(budgetSaved.income).toLocaleString()}</span></span>}
          />
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {budgetSaved.ledgers.map((l, i) => {
                const savedAmount = l.amount || ((Number(budgetSaved.income) * Number(l.percent)) / 100);
                return (
                  <Card key={i} className="p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--text)]">{l.name}</span>
                      <span className="text-xs text-warning font-medium">{l.percent}%</span>
                    </div>
                    <div className="text-lg font-bold text-[var(--text)]">₹{savedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${Math.min(l.percent, 100)}%` }} />
                    </div>
                  </Card>
                );
              })}
            </div>
            {(() => {
              const total = budgetSaved.ledgers.reduce((s, l) => s + Number(l.percent), 0);
              return total !== 100
                ? <p className="text-xs text-danger flex items-center gap-1"><AlertCircle size={12} /> Ledgers sum to {total}% (should be 100%)</p>
                : <p className="text-xs text-accent flex items-center gap-1"><CheckCircle2 size={12} /> 100% allocated</p>;
            })()}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title={budgetEditMode || budgetSaved ? "Update Budget Plan" : "Create Budget Plan"} icon={<Percent size={16} />} />
        <CardBody>
          <form onSubmit={saveBudgetPlan} className="flex flex-col gap-6">
            <Input
              label="Total Monthly Income (₹)"
              required
              type="number" min="0" step="0.01" placeholder="e.g. 50000"
              className="md:w-64"
              value={budgetIncome}
              onChange={(e) => updateIncome(e.target.value)}
            />

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-sm font-medium text-[var(--text)]">Ledgers (must total 100%)</label>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={loadCategoriesIntoBudget}>Sync Categories</Button>
                  <Button type="button" variant="secondary" size="sm" icon={<Plus size={12} />} onClick={() => setBudgetLedgers(l => [...l, { name: "", percent: "", amount: "" }])}>Add Ledger</Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {budgetLedgers.map((l, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 rounded-xl bg-[var(--surface-hover)] sm:bg-transparent sm:p-0">
                    <div className="flex-1">
                      <Input
                        label={i === 0 ? "Ledger Name" : undefined}
                        placeholder="e.g. Savings"
                        value={l.name}
                        onChange={(e) => setBudgetLedgers(ls => ls.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        list={`categories-${i}`}
                      />
                      <datalist id={`categories-${i}`}>
                        {categories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                    </div>
                    <div className="w-full sm:w-36">
                      <Input
                        label={i === 0 ? "Amount (₹)" : undefined}
                        type="number" min="0" step="1" placeholder="Amount"
                        value={l.amount}
                        onChange={(e) => updateLedgerAmount(i, e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <Input
                        label={i === 0 ? "Percent" : undefined}
                        type="number" min="0" max="100" step="0.1" placeholder="%"
                        value={l.percent}
                        onChange={(e) => updateLedgerPercent(i, e.target.value)}
                      />
                    </div>
                    {budgetLedgers.length > 1 && (
                      <IconButton label="Remove ledger" variant="danger" onClick={() => setBudgetLedgers(ls => ls.filter((_, j) => j !== i))}>
                        <X size={14} />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>

              {budgetLedgers.some(l => l.percent || l.amount) && (() => {
                const totalPercent = budgetLedgers.reduce((s, l) => s + (Number(l.percent) || 0), 0);
                const totalAmount = budgetLedgers.reduce((s, l) => s + (Number(l.amount) || 0), 0);
                const income = Number(budgetIncome) || 0;
                return (
                  <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[var(--text-muted)]">Total Allocated: </span>
                        <span className={totalAmount === income ? 'text-accent' : totalAmount > income ? 'text-danger' : 'text-warning'}>₹{totalAmount.toLocaleString()}</span>
                        {income > 0 && <span className="text-[var(--text-muted)] ml-2">({totalAmount > 0 ? ((totalAmount / income) * 100).toFixed(1) : '0'}%)</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-[var(--text-muted)]">Remaining: </span>
                        <span className={income - totalAmount >= 0 ? 'text-accent' : 'text-danger'}>₹{(income - totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                    {totalPercent !== 100 && (
                      <p className={`mt-2 text-xs ${totalPercent === 100 ? 'text-accent' : 'text-warning'}`}>
                        Percentage Total: {totalPercent.toFixed(1)}% {totalPercent === 100 ? '✓' : `(${100 - totalPercent > 0 ? `${(100 - totalPercent).toFixed(1)}% remaining` : `${(totalPercent - 100).toFixed(1)}% over`})`}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" loading={budgetLoading}>{budgetEditMode ? "Update Budget Plan" : "Save Budget Plan"}</Button>
              {budgetEditMode && <Button type="button" variant="secondary" onClick={cancelEditBudget}>Cancel Edit</Button>}
              <Button type="button" variant="ghost" onClick={saveBudgetDraft}>Save as Draft</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </motion.div>
  );
}
