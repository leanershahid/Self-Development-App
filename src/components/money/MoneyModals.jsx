import React from 'react';
import { Edit2, PlusCircle, CheckCircle2, X, Plus, Check } from 'lucide-react';
import { Modal, ConfirmDialog, Input, Select, DateField, IconButton, Button } from '../ui';
import CloudinaryUpload from '../CloudinaryUpload';

export function TransactionModal({
  formOpen, closeTransactionForm, editingId, createTransaction, loading,
  form, setForm, categories, showNewCategory, setShowNewCategory,
  newCategoryInput, setNewCategoryInput, addCategory,
}) {
  return (
    <Modal
      open={formOpen}
      onClose={closeTransactionForm}
      title={editingId ? "Update Transaction" : "New Transaction"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeTransactionForm}>Cancel</Button>
          <Button
            form="transaction-form"
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!form.title.trim() || !form.amount}
            icon={editingId ? <Edit2 size={16} /> : <PlusCircle size={16} />}
          >
            {editingId ? "Save Changes" : "Add Transaction"}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={createTransaction} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Title"
            required
            placeholder="e.g. Salary, Groceries, Rent"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <Input
          label="Amount (₹)"
          required
          type="number" step="0.01" min="0" placeholder="0.00"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">Category</label>
          {!showNewCategory ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">-- Select category --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <IconButton label="New category" variant="accent" onClick={() => setShowNewCategory(true)}>
                <Plus size={16} />
              </IconButton>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="New category name..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory(newCategoryInput))}
                  autoFocus
                />
              </div>
              <IconButton label="Confirm new category" variant="accent" onClick={() => addCategory(newCategoryInput)}>
                <CheckCircle2 size={16} />
              </IconButton>
              <IconButton label="Cancel new category" onClick={() => { setShowNewCategory(false); setNewCategoryInput(""); }}>
                <X size={16} />
              </IconButton>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <DateField
            label="Date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}

export function DeleteTransactionDialog({ deleteTxId, setDeleteTxId, confirmDeleteTransaction }) {
  return (
    <ConfirmDialog
      open={!!deleteTxId}
      onClose={() => setDeleteTxId(null)}
      onConfirm={confirmDeleteTransaction}
      title="Delete transaction"
      message="Are you sure you want to delete this transaction? This cannot be undone."
      confirmLabel="Delete"
    />
  );
}

export function ShoppingItemModal({
  editingShopId, setEditingShopId, saveEditShopItem, shopLoading, UNITS,
  editShopForm, setEditShopForm,
}) {
  return (
    <Modal
      open={!!editingShopId}
      onClose={() => setEditingShopId(null)}
      title="Edit Shopping Item"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => setEditingShopId(null)}>Cancel</Button>
          <Button form="edit-shop-form" type="submit" variant="primary" loading={shopLoading} icon={<CheckCircle2 size={16} />}>Save Changes</Button>
        </>
      }
    >
      <form id="edit-shop-form" onSubmit={saveEditShopItem} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Name" required autoFocus value={editShopForm.name} onChange={(e) => setEditShopForm({ ...editShopForm, name: e.target.value })} />
        </div>
        <Input label="Amount (₹)" required type="number" min="0" step="0.01" value={editShopForm.amount} onChange={(e) => setEditShopForm({ ...editShopForm, amount: e.target.value })} />
        <Select label="Priority" value={editShopForm.priority} onChange={(e) => setEditShopForm({ ...editShopForm, priority: e.target.value })}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Input label="Quantity" type="number" min="0" step="0.01" value={editShopForm.quantity} onChange={(e) => setEditShopForm({ ...editShopForm, quantity: e.target.value })} />
        <Select label="Unit" value={editShopForm.unit} onChange={(e) => setEditShopForm({ ...editShopForm, unit: e.target.value })}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </Select>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">Image</label>
          <CloudinaryUpload label="Upload Image" currentUrl={editShopForm.image_url} onUpload={(url) => setEditShopForm(f => ({ ...f, image_url: url }))} />
        </div>
      </form>
    </Modal>
  );
}

export function ScanReviewModal({
  scanReview, setScanReview, discardScanReview, confirmScanReview, scanSaving, scanError, categories,
}) {
  return (
    <Modal
      open={!!scanReview}
      onClose={discardScanReview}
      title="Review Scanned Bill"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={discardScanReview}>Discard</Button>
          <Button
            variant="primary"
            onClick={confirmScanReview}
            loading={scanSaving}
            disabled={!scanReview?.title?.trim() || !scanReview?.amount}
            icon={<Check size={16} />}
          >
            Confirm &amp; Add
          </Button>
        </>
      }
    >
      {scanReview && (
        <div className="flex flex-col gap-4">
          {scanReview.previewUrl && (
            <img src={scanReview.previewUrl} alt="Scanned bill" className="w-full max-h-48 object-contain rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]" />
          )}
          <p className="text-xs text-[var(--text-muted)]">AI-extracted — please verify before saving.</p>

          <Input label="Title" required value={scanReview.title} onChange={(e) => setScanReview(r => ({ ...r, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₹)" required type="number" step="0.01" min="0" value={scanReview.amount} onChange={(e) => setScanReview(r => ({ ...r, amount: e.target.value }))} />
            <Select label="Type" value={scanReview.type} onChange={(e) => setScanReview(r => ({ ...r, type: e.target.value }))}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Category" list="scan-category-list" placeholder="e.g. Food" value={scanReview.category} onChange={(e) => setScanReview(r => ({ ...r, category: e.target.value }))} />
              <datalist id="scan-category-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <DateField label="Date" value={scanReview.date} onChange={(e) => setScanReview(r => ({ ...r, date: e.target.value }))} />
          </div>

          {scanError && <p className="text-sm text-danger">{scanError}</p>}
        </div>
      )}
    </Modal>
  );
}

export function ImageLightbox({ lightboxImg, setLightboxImg }) {
  if (!lightboxImg) return null;
  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/70"
      onClick={() => setLightboxImg(null)}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-12 right-0">
          <IconButton label="Close" className="bg-[var(--surface)] border border-[var(--border)]" onClick={() => setLightboxImg(null)}>
            <X size={20} />
          </IconButton>
        </div>
        <img src={lightboxImg} alt="Item" className="w-full max-h-[80vh] object-contain rounded-2xl border border-[var(--border)]" />
      </div>
    </div>
  );
}
