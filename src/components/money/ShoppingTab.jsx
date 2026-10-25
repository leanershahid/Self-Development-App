import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, Plus, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Select, Button, Table, EmptyState } from '../ui';
import CloudinaryUpload from '../CloudinaryUpload';

export default function ShoppingTab({
  shopForm, setShopForm, addShoppingItem, shopLoading, UNITS,
  shopColumns, visibleShopItems, shopSearch, setShopSearch,
  shoppingPlans, completedPlans, showCompleted, setShowCompleted,
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-secondary/10 text-secondary">
          <ShoppingCart size={28} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text)]">Shopping Plan</h2>
        <p className="text-sm text-[var(--text-muted)]">Plan before you spend.</p>
      </div>

      <Card>
        <CardHeader title="Add Shopping Item" icon={<ShoppingCart size={16} />} />
        <CardBody>
          <form onSubmit={addShoppingItem} className="grid gap-4 md:grid-cols-3">
            <Input label="Item Name" required placeholder="e.g. Groceries, Shoes" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
            <Input label="Est. Amount (₹)" required type="number" min="0" step="0.01" placeholder="0.00" value={shopForm.amount} onChange={(e) => setShopForm({ ...shopForm, amount: e.target.value })} />
            <Select label="Priority" value={shopForm.priority} onChange={(e) => setShopForm({ ...shopForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Input label="Quantity" type="number" min="0" step="0.01" placeholder="e.g. 2" value={shopForm.quantity} onChange={(e) => setShopForm({ ...shopForm, quantity: e.target.value })} />
            <Select label="Unit" value={shopForm.unit} onChange={(e) => setShopForm({ ...shopForm, unit: e.target.value })}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">Item Image</label>
              <CloudinaryUpload label="Upload Image" currentUrl={shopForm.image_url} onUpload={(url) => setShopForm(f => ({ ...f, image_url: url }))} />
            </div>
            <div className="flex items-end md:col-start-3">
              <Button type="submit" variant="primary" className="w-full" loading={shopLoading} icon={<Plus size={14} />}>Add to Plan</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Shopping List"
          icon={<ShoppingCart size={16} />}
          action={
            <div className="flex items-center gap-4">
              <div className="w-56 hidden sm:block">
                <Input leadingIcon={<Search size={14} />} placeholder="Search items..." value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} />
              </div>
              {shoppingPlans.length > 0 && (
                <span className="font-semibold text-secondary text-sm whitespace-nowrap">
                  Total ₹{shoppingPlans.reduce((s, i) => s + Number(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          }
        />
        <CardBody>
          <div className="sm:hidden mb-4">
            <Input leadingIcon={<Search size={14} />} placeholder="Search items..." value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} />
          </div>
          <Table
            columns={shopColumns}
            data={visibleShopItems}
            rowKey={(item) => item.id}
            pageSize={10}
            emptyState={<EmptyState icon={<ShoppingCart size={20} />} title="No items in shopping plan" message="Add an item above to start planning your purchases." />}
          />
        </CardBody>
      </Card>

      {completedPlans.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors w-fit"
          >
            <CheckCircle2 size={14} className="text-accent" />
            {showCompleted ? 'Hide' : 'Show'} Completed ({completedPlans.length})
          </button>
          {showCompleted && (
            <Card className="opacity-80">
              <CardBody className="flex flex-col divide-y divide-[var(--border)]">
                {completedPlans.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={15} className="text-accent shrink-0" />
                      <span className="text-[var(--text-muted)] line-through">{item.name}</span>
                    </div>
                    <span className="font-medium text-[var(--text-muted)] line-through">
                      ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
}
