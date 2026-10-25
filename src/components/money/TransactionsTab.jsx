import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, IndianRupee, Search, Filter,
  Plus, Wallet, ScanLine, Loader2,
} from 'lucide-react';
import Chart from 'react-apexcharts';
import { Card, CardHeader, CardBody, KpiCard, Table, Input, Button, EmptyState } from '../ui';

export default function TransactionsTab({
  scanning, scanError, onScanClick, onNewTransaction,
  balanceDetails, expenseData, incomeData,
  txSearch, setTxSearch, txColumns, filteredTransactions, loading, transactionsCount,
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Overview</h2>
            <p className="text-sm text-[var(--text-muted)]">Your income, expenses and balance at a glance.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              icon={scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
              disabled={scanning}
              onClick={onScanClick}
            >
              {scanning ? "Scanning..." : "Scan Bill"}
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={onNewTransaction}>
              New Transaction
            </Button>
          </div>
        </div>

        {scanError && <p className="text-sm text-danger text-center">{scanError}</p>}

        {/* Balance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            icon={<Wallet size={18} />}
            label="Net Balance"
            value={`₹${balanceDetails.totalBalance.toLocaleString()}`}
            tone={balanceDetails.totalBalance >= 0 ? 'primary' : 'danger'}
          />
          <KpiCard
            icon={<TrendingUp size={18} />}
            label="Total Income"
            value={`₹${balanceDetails.totalIncome.toLocaleString()}`}
            tone="accent"
          />
          <KpiCard
            icon={<TrendingDown size={18} />}
            label="Total Expenses"
            value={`₹${balanceDetails.totalExpense.toLocaleString()}`}
            tone="danger"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Expenses by Category" icon={<PieChartIcon size={16} />} />
            <CardBody>
              {expenseData.series?.length > 0 ? (
                <div className="h-[280px] w-full">
                  <Chart options={expenseData.options} series={expenseData.series} type="donut" height="100%" />
                </div>
              ) : (
                <EmptyState icon={<PieChartIcon size={18} />} title="No expenses yet" message="Add an expense transaction to see the breakdown." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Income by Category" icon={<BarChart3 size={16} />} />
            <CardBody>
              {incomeData.series?.[0]?.data?.length > 0 ? (
                <div className="h-[280px] w-full">
                  <Chart options={incomeData.options} series={incomeData.series} type="bar" height="100%" />
                </div>
              ) : (
                <EmptyState icon={<BarChart3 size={18} />} title="No income yet" message="Add an income transaction to see the breakdown." />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Transaction Ledger */}
        <Card>
          <CardHeader
            title="Transaction Ledger"
            icon={<Filter size={16} />}
            action={
              <div className="w-full sm:w-64">
                <Input
                  leadingIcon={<Search size={14} />}
                  placeholder="Search transactions..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                />
              </div>
            }
          />
          <CardBody>
            <Table
              columns={txColumns}
              data={filteredTransactions}
              rowKey={(t) => t.id}
              loading={loading}
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={<Search size={20} />}
                  title={transactionsCount === 0 ? "No transactions yet" : "No matching transactions"}
                  message={transactionsCount === 0 ? "Record your first transaction to start tracking." : "Try adjusting your search or filters."}
                  action={transactionsCount === 0 ? (
                    <Button variant="primary" icon={<Plus size={16} />} onClick={onNewTransaction}>New Transaction</Button>
                  ) : undefined}
                />
              }
            />
          </CardBody>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
