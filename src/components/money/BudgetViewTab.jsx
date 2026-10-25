import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Wallet, PieChart as PieChartIcon, Percent, RefreshCw, Plus } from 'lucide-react';
import Chart from 'react-apexcharts';
import { Card, CardHeader, CardBody, KpiCard, Badge, Button, EmptyState } from '../ui';

export default function BudgetViewTab({ budgetSaved, CHART_COLORS, onEditBudget, onViewTransactions, onCreateBudget }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
          <Eye size={28} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Budget Analysis</h2>
        <p className="text-sm text-[var(--text-muted)]">Financial allocation overview for your active budget plan.</p>
      </div>

      {budgetSaved ? (
        <>
          <Card>
            <CardHeader
              title="Active Budget Plan"
              icon={<Wallet size={16} />}
              action={
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Monthly Income</p>
                  <p className="text-lg font-bold text-accent">₹{Number(budgetSaved.income).toLocaleString()}</p>
                </div>
              }
            />
            <CardBody className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {budgetSaved.ledgers.map((ledger, i) => {
                  const savedAmount = ledger.amount || ((Number(budgetSaved.income) * Number(ledger.percent)) / 100);
                  const color = CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <Card key={i} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-[var(--text)] truncate">{ledger.name}</h4>
                        <Badge variant="success">{ledger.percent}%</Badge>
                      </div>
                      <div className="text-xl font-bold text-[var(--text)] mb-1">
                        ₹{savedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mb-3">per month</div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(ledger.percent, 100)}%`, background: color }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[var(--text-muted)]">
                        <span>Daily: ₹{(savedAmount / 30).toFixed(0)}</span>
                        <span>Weekly: ₹{(savedAmount / 4.33).toFixed(0)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {(() => {
                const totalPercent = budgetSaved.ledgers.reduce((s, l) => s + Number(l.percent), 0);
                const totalAllocated = budgetSaved.ledgers.reduce((s, l) => s + (Number(l.amount) || ((Number(budgetSaved.income) * Number(l.percent)) / 100)), 0);
                const remaining = Number(budgetSaved.income) - totalAllocated;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard icon={<Wallet size={18} />} label="Total Allocated" value={`₹${totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="accent" footer={<span className="text-xs text-[var(--text-muted)]">{totalPercent.toFixed(1)}% of income</span>} />
                    <KpiCard icon={<Percent size={18} />} label="Remaining" value={`₹${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone={remaining >= 0 ? 'primary' : 'danger'} footer={<span className="text-xs text-[var(--text-muted)]">{remaining >= 0 ? 'Available' : 'Over budget'}</span>} />
                    <KpiCard icon={<RefreshCw size={18} />} label="Ledgers" value={budgetSaved.ledgers.length} tone="warning" footer={<span className="text-xs text-[var(--text-muted)]">Active categories</span>} />
                  </div>
                );
              })()}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Budget Allocation Breakdown" icon={<PieChartIcon size={16} />} />
            <CardBody>
              {(() => {
                const chartData = {
                  series: budgetSaved.ledgers.map(l => l.amount || ((Number(budgetSaved.income) * Number(l.percent)) / 100)),
                  options: {
                    chart: { type: 'donut', background: 'transparent', foreColor: '#64748b' },
                    labels: budgetSaved.ledgers.map(l => l.name),
                    colors: CHART_COLORS,
                    stroke: { show: true, colors: ['#ffffff'], width: 2 },
                    dataLabels: { enabled: false },
                    legend: { position: 'bottom', labels: { colors: '#64748b' } },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '70%',
                          background: 'transparent',
                          labels: {
                            show: true,
                            name: { show: true, fontSize: '12px', color: '#64748b' },
                            value: { show: true, fontSize: '20px', fontWeight: 'bold', color: '#0f172a', formatter: (val) => `₹${Number(val).toLocaleString()}` },
                            total: { show: true, label: 'BUDGET', color: '#64748b', formatter: () => `₹${Number(budgetSaved.income).toLocaleString()}` }
                          }
                        }
                      }
                    },
                    tooltip: { theme: 'light', y: { formatter: (val) => `₹${val.toLocaleString()}` } }
                  }
                };
                return (
                  <div className="h-[360px] w-full">
                    <Chart options={chartData.options} series={chartData.series} type="donut" height="100%" />
                  </div>
                );
              })()}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" icon={<Plus size={16} />} />
            <CardBody>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={onEditBudget}>Edit Budget Plan</Button>
                <Button variant="ghost" onClick={onViewTransactions}>View Transactions</Button>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Wallet size={20} />}
            title="No budget plan found"
            message="Create a budget plan to view analysis."
            action={<Button variant="primary" onClick={onCreateBudget}>Create Budget Plan</Button>}
          />
        </Card>
      )}
    </motion.div>
  );
}
