import { useEffect, useRef, useState } from "react";
import {
    IndianRupee, Edit2, Trash2, ShoppingCart, Check,
    TrendingUp, TrendingDown, ArrowUp, Minus, AlertCircle,
} from "lucide-react";
import { IconButton, Badge, Tabs, SkeletonCard, useToast } from "./ui";
import { supabase } from "../supabase";

import TransactionsTab from "./money/TransactionsTab";
import LedgerFilterTab from "./money/LedgerFilterTab";
import BudgetViewTab from "./money/BudgetViewTab";
import BudgetPlanTab from "./money/BudgetPlanTab";
import ShoppingTab from "./money/ShoppingTab";
import {
    TransactionModal, DeleteTransactionDialog, ShoppingItemModal, ScanReviewModal, ImageLightbox,
} from "./money/MoneyModals";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function scanBillWithGemini(file) {
    const base64 = await fileToBase64(file);
    const prompt = `You are extracting structured data from a photo of a bill/receipt. Return ONLY raw JSON (no markdown, no code fences, no explanation) with exactly these keys:
{"title": "short merchant or item name", "amount": number (final total paid, no currency symbol), "type": "expense" or "income", "category": "one short word like Food, Groceries, Transport, Fuel, Shopping, Bills, Entertainment, Health, Rent, Travel", "date": "YYYY-MM-DD from the receipt, or today if not visible"}
If you cannot read the bill clearly, make your best reasonable guess. Respond with JSON only.`;

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
                ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
}

export default function MoneyPage() {
    const toast = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTxId, setDeleteTxId] = useState(null);
    const [activeTab, setActiveTab] = useState("transactions");
    const [shoppingPlans, setShoppingPlans] = useState([]);
    const [completedPlans, setCompletedPlans] = useState([]);
    const [shopForm, setShopForm] = useState({ name: "", amount: "", image_url: "", priority: "medium", quantity: "", unit: "nos" });
    const [shopLoading, setShopLoading] = useState(false);
    const [editingShopId, setEditingShopId] = useState(null);
    const [editShopForm, setEditShopForm] = useState({ name: "", amount: "", image_url: "", priority: "medium", quantity: "", unit: "nos" });
    const [lightboxImg, setLightboxImg] = useState(null);

    const UNITS = ["nos", "kg", "g", "ltr", "ml", "pcs", "pack", "box", "dozen", "pair", "m", "cm"];
    const [shopSearch, setShopSearch] = useState("");

    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
    const priorityConfig = {
        high:   { label: "High",   variant: "danger",  icon: <ArrowUp size={11} /> },
        medium: { label: "Medium", variant: "warning", icon: <Minus size={11} /> },
        low:    { label: "Low",    variant: "neutral", icon: <AlertCircle size={11} /> },
    };
    const [showCompleted, setShowCompleted] = useState(false);
    const [txSearch, setTxSearch] = useState("");
    const [filterLedgers, setFilterLedgers] = useState([]);
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [budgetIncome, setBudgetIncome] = useState("");
    const [budgetLedgers, setBudgetLedgers] = useState([{ name: "", percent: "", amount: "" }]);
    const [budgetSaved, setBudgetSaved] = useState(null);
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetEditMode, setBudgetEditMode] = useState(false);
    const [budgetDraft, setBudgetDraft] = useState(() => {
        try { return JSON.parse(localStorage.getItem("budget_draft")) || null; } catch { return null; }
    });
    const [categories, setCategories] = useState([]);
    const [newCategoryInput, setNewCategoryInput] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);

    const [balanceDetails, setBalanceDetails] = useState({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0
    });

    const CHART_COLORS = [
        '#10b981', // accent — emerald
        '#1e3a5f', // primary — navy
        '#2563eb', // info — blue
        '#d97706', // warning — amber
        '#dc2626', // danger — red
        '#334155', // secondary — slate
        '#0ea371', // accent hover — emerald
    ];

    const [expenseData, setExpenseData] = useState({ series: [], options: {} });
    const [incomeData, setIncomeData] = useState({ series: [], options: {} });

    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [scanReview, setScanReview] = useState(null); // { title, amount, type, category, date, previewUrl }
    const [scanSaving, setScanSaving] = useState(false);
    const scanFileRef = useRef();

    async function handleScanFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setScanning(true);
        setScanError(null);
        const previewUrl = URL.createObjectURL(file);
        try {
            const extracted = await scanBillWithGemini(file);
            setScanReview({
                title: extracted.title || "",
                amount: extracted.amount ? String(extracted.amount) : "",
                type: extracted.type === "income" ? "income" : "expense",
                category: (extracted.category || "").trim(),
                date: extracted.date || new Date().toISOString().split("T")[0],
                previewUrl,
            });
        } catch {
            URL.revokeObjectURL(previewUrl);
            setScanError("Couldn't read that bill. Try a clearer photo or enter it manually.");
        } finally {
            setScanning(false);
            e.target.value = "";
        }
    }

    function discardScanReview() {
        if (scanReview?.previewUrl) URL.revokeObjectURL(scanReview.previewUrl);
        setScanReview(null);
    }

    async function confirmScanReview() {
        if (!scanReview || !scanReview.title.trim() || !scanReview.amount) return;
        setScanSaving(true);
        const cat = scanReview.category.trim();
        if (cat && !categories.includes(cat)) {
            setCategories(prev => [...prev, cat]);
        }
        const { error } = await supabase.from("money_transactions").insert({
            title: scanReview.title.trim(),
            amount: Number(scanReview.amount),
            type: scanReview.type,
            category: cat || null,
            date: scanReview.date || new Date().toISOString().split("T")[0],
        });
        setScanSaving(false);
        if (error) {
            setScanError("Couldn't save the transaction. Please try again.");
            return;
        }
        discardScanReview();
        await fetchTransactions();
        toast.success("Transaction added from scan");
    }

    const [form, setForm] = useState({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchTransactions();
        fetchShoppingPlans();
        fetchCategories();
        fetchBudgetPlan();
    }, []);

    useEffect(() => {
        syncLedgersWithCategories();
    }, [budgetSaved, categories]);

    async function fetchBudgetPlan() {
        const { data } = await supabase.from("budget_plan").select("*").order("created_at", { ascending: false }).limit(1);
        if (data && data[0]) {
            const plan = { ...data[0], income: data[0].income, ledgers: data[0].ledgers };
            setBudgetSaved(plan);
        }
    }

    async function saveBudgetPlan(e) {
        e.preventDefault();
        const ledgers = budgetLedgers.filter(l => l.name.trim() && (l.percent || l.amount)).map(l => ({
            name: l.name,
            percent: Number(l.percent) || 0,
            amount: Number(l.amount) || 0
        }));
        if (!budgetIncome || ledgers.length === 0) return;
        setBudgetLoading(true);

        if (budgetEditMode && budgetSaved) {
            // Update existing budget plan
            await supabase.from("budget_plan").update({
                income: Number(budgetIncome),
                ledgers
            }).eq("id", budgetSaved.id);
        } else {
            // Create new budget plan (delete old ones first)
            await supabase.from("budget_plan").delete().neq("id", 0);
            await supabase.from("budget_plan").insert({ income: Number(budgetIncome), ledgers });
        }

        localStorage.removeItem("budget_draft");
        setBudgetDraft(null);
        setBudgetEditMode(false);
        await fetchBudgetPlan();
        setBudgetLoading(false);
        toast.success("Budget plan saved");
    }

    function saveBudgetDraft() {
        const ledgers = budgetLedgers.filter(l => l.name.trim() || l.percent);
        if (!budgetIncome && ledgers.length === 0) return;
        const draft = { income: budgetIncome, ledgers: budgetLedgers };
        localStorage.setItem("budget_draft", JSON.stringify(draft));
        setBudgetDraft(draft);
        toast.success("Draft saved");
    }

    function loadBudgetDraft() {
        if (!budgetDraft) return;
        setBudgetIncome(budgetDraft.income || "");
        setBudgetLedgers(budgetDraft.ledgers?.length ? budgetDraft.ledgers : [{ name: "", percent: "", amount: "" }]);
    }

    function clearBudgetDraft() {
        localStorage.removeItem("budget_draft");
        setBudgetDraft(null);
    }

    function startEditBudget() {
        if (!budgetSaved) return;
        setBudgetIncome(budgetSaved.income.toString());
        setBudgetLedgers(budgetSaved.ledgers.map(l => ({
            name: l.name,
            percent: l.percent.toString(),
            amount: l.amount ? l.amount.toString() : ""
        })));
        setBudgetEditMode(true);
        setActiveTab("budget");
    }

    function cancelEditBudget() {
        setBudgetEditMode(false);
        setBudgetIncome("");
        setBudgetLedgers([{ name: "", percent: "", amount: "" }]);
    }

    async function fetchCategories() {
        const { data } = await supabase.from("categories").select("name").order("name");
        setCategories((data || []).map(c => c.name));
    }

    // Sync budget ledgers with categories
    function syncLedgersWithCategories() {
        if (budgetSaved?.ledgers) {
            const existingLedgerNames = budgetSaved.ledgers.map(l => l.name);
            const newCategories = existingLedgerNames.filter(name => name && !categories.includes(name));

            if (newCategories.length > 0) {
                newCategories.forEach(async (name) => {
                    await supabase.from("categories").upsert({ name }, { onConflict: "name" });
                });
                fetchCategories();
            }
        }
    }

    // Load categories into budget ledgers
    function loadCategoriesIntoBudget() {
        const categoryLedgers = categories.map(cat => {
            const existing = budgetLedgers.find(l => l.name === cat);
            return existing || { name: cat, percent: "", amount: "" };
        });

        // Add any existing ledgers that aren't categories
        const nonCategoryLedgers = budgetLedgers.filter(l => l.name && !categories.includes(l.name));

        setBudgetLedgers([...categoryLedgers, ...nonCategoryLedgers]);
    }

    // Calculate percentage when amount changes
    function updateLedgerAmount(index, amount) {
        const numAmount = Number(amount) || 0;
        const income = Number(budgetIncome) || 0;
        const percent = income > 0 ? ((numAmount / income) * 100).toFixed(1) : "";

        setBudgetLedgers(ls => ls.map((x, j) =>
            j === index ? { ...x, amount, percent } : x
        ));
    }

    // Calculate amount when percentage changes
    function updateLedgerPercent(index, percent) {
        const numPercent = Number(percent) || 0;
        const income = Number(budgetIncome) || 0;
        const amount = income > 0 ? ((numPercent / 100) * income).toFixed(0) : "";

        setBudgetLedgers(ls => ls.map((x, j) =>
            j === index ? { ...x, percent, amount } : x
        ));
    }

    // Recalculate all amounts when income changes
    function updateIncome(newIncome) {
        setBudgetIncome(newIncome);
        const income = Number(newIncome) || 0;

        if (income > 0) {
            setBudgetLedgers(ls => ls.map(l => {
                if (l.percent) {
                    const amount = ((Number(l.percent) / 100) * income).toFixed(0);
                    return { ...l, amount };
                }
                return l;
            }));
        }
    }

    async function addCategory(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        await supabase.from("categories").upsert({ name: trimmed }, { onConflict: "name" });
        await fetchCategories();
        setForm(f => ({ ...f, category: trimmed }));
        setNewCategoryInput("");
        setShowNewCategory(false);
    }

    async function fetchShoppingPlans() {
        const [{ data: active }, { data: done }] = await Promise.all([
            supabase.from("shopping_plans").select("*").eq("completed", false).order("created_at", { ascending: false }),
            supabase.from("shopping_plans").select("*").eq("completed", true).order("created_at", { ascending: false }).limit(50),
        ]);
        setShoppingPlans(active || []);
        setCompletedPlans(done || []);
    }

    async function addShoppingItem(e) {
        e.preventDefault();
        if (!shopForm.name.trim() || !shopForm.amount) return;
        setShopLoading(true);
        await supabase.from("shopping_plans").insert({
            name: shopForm.name.trim(),
            amount: Number(shopForm.amount),
            image_url: shopForm.image_url.trim() || null,
            priority: shopForm.priority,
            quantity: shopForm.quantity ? Number(shopForm.quantity) : null,
            unit: shopForm.unit || "nos",
        });
        setShopForm({ name: "", amount: "", image_url: "", priority: "medium", quantity: "", unit: "nos" });
        await fetchShoppingPlans();
        setShopLoading(false);
        toast.success("Item added to shopping plan");
    }

    async function saveEditShopItem(e) {
        e.preventDefault();
        if (!editShopForm.name.trim() || !editShopForm.amount) return;
        setShopLoading(true);
        await supabase.from("shopping_plans").update({
            name: editShopForm.name.trim(),
            amount: Number(editShopForm.amount),
            image_url: editShopForm.image_url.trim() || null,
            priority: editShopForm.priority,
            quantity: editShopForm.quantity ? Number(editShopForm.quantity) : null,
            unit: editShopForm.unit || "nos",
        }).eq("id", editingShopId);
        setEditingShopId(null);
        await fetchShoppingPlans();
        setShopLoading(false);
        toast.success("Item updated");
    }

    async function completeShoppingItem(item) {
        setShopLoading(true);
        await supabase.from("shopping_plans").update({ completed: true }).eq("id", item.id);
        await supabase.from("money_transactions").insert({
            title: item.name,
            amount: item.amount,
            type: "expense",
            category: "Shopping",
            date: new Date().toISOString().split('T')[0],
            shopping_plan_id: item.id,
        });
        await fetchShoppingPlans();
        await fetchTransactions();
        setShopLoading(false);
        toast.success("Marked as purchased");
    }

    async function deleteShoppingItem(id) {
        setShopLoading(true);
        await supabase.from("shopping_plans").delete().eq("id", id);
        await fetchShoppingPlans();
        setShopLoading(false);
        toast.success("Item removed");
    }

    async function fetchTransactions() {
        setLoading(true);
        const { data, error } = await supabase
            .from("money_transactions")
            .select("*")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        setTransactions(data || []);

        // Calculate balances
        let income = 0;
        let expense = 0;
        const expMap = {};
        const incMap = {};

        (data || []).forEach(t => {
            const cat = t.category || 'General';
            if (t.type === 'income') {
                income += Number(t.amount);
                incMap[cat] = (incMap[cat] || 0) + Number(t.amount);
            } else if (t.type === 'expense') {
                expense += Number(t.amount);
                expMap[cat] = (expMap[cat] || 0) + Number(t.amount);
            }
        });

        setBalanceDetails({
            totalBalance: income - expense,
            totalIncome: income,
            totalExpense: expense
        });

        const sortedExp = Object.keys(expMap).map(k => ({ name: k, value: expMap[k] })).sort((a, b) => b.value - a.value);
        const sortedInc = Object.keys(incMap).map(k => ({ name: k, value: incMap[k] })).sort((a, b) => b.value - a.value);

        setExpenseData({
            series: sortedExp.map(d => d.value),
            options: {
                chart: { type: 'donut', background: 'transparent', foreColor: '#64748b' },
                labels: sortedExp.map(d => d.name),
                colors: CHART_COLORS,
                stroke: { show: true, colors: ['#ffffff'], width: 2 },
                dataLabels: { enabled: false },
                legend: {
                    position: 'bottom',
                    labels: { colors: '#64748b' }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '75%',
                            background: 'transparent',
                            labels: {
                                show: true,
                                name: { show: true, fontSize: '12px', color: '#64748b' },
                                value: {
                                    show: true,
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: '#0f172a',
                                    formatter: (val) => `₹${Number(val).toLocaleString()}`
                                },
                                total: {
                                    show: true,
                                    label: 'EXPENSES',
                                    color: '#64748b',
                                    formatter: () => `₹${expense.toLocaleString()}`
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    theme: 'light',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setIncomeData({
            series: [{
                name: 'Amount',
                data: sortedInc.map(d => d.value)
            }],
            options: {
                chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
                plotOptions: {
                    bar: {
                        borderRadius: 6,
                        horizontal: true,
                        barHeight: '60%',
                        distributed: true
                    }
                },
                colors: CHART_COLORS.slice().reverse(),
                dataLabels: { enabled: false },
                xaxis: {
                    categories: sortedInc.map(d => d.name),
                    labels: {
                        style: { colors: '#64748b' },
                        formatter: (val) => `₹${val}`
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { style: { colors: '#0f172a' } }
                },
                grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
                tooltip: {
                    theme: 'light',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setLoading(false);
    }

    async function createTransaction(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.amount) return;

        const wasEdit = !!editingId;
        setLoading(true);

        if (editingId) {
            const { error } = await supabase
                .from("money_transactions")
                .update({
                    title: form.title.trim(),
                    amount: Number(form.amount),
                    type: form.type,
                    category: form.category.trim() || null,
                    date: form.date || new Date().toISOString().split('T')[0],
                })
                .eq("id", editingId);

            if (error) {
                console.error(error);
                toast.error("Failed to update transaction");
                setLoading(false);
                return;
            }
        } else {
            const { error } = await supabase
                .from("money_transactions")
                .insert({
                    title: form.title.trim(),
                    amount: Number(form.amount),
                    type: form.type,
                    category: form.category.trim() || null,
                    date: form.date || new Date().toISOString().split('T')[0],
                });

            if (error) {
                console.error(error);
                toast.error("Failed to add transaction");
                setLoading(false);
                return;
            }
        }

        setForm({
            title: "",
            amount: "",
            type: "expense",
            category: "",
            date: new Date().toISOString().split('T')[0],
        });

        setFormOpen(false);
        setEditingId(null);
        await fetchTransactions();
        toast.success(wasEdit ? "Transaction updated" : "Transaction added");
    }

    async function deleteTransaction(id) {
        setLoading(true);
        const { data: txn } = await supabase
            .from("money_transactions")
            .select("shopping_plan_id")
            .eq("id", id)
            .single();

        await supabase.from("money_transactions").delete().eq("id", id);

        if (txn?.shopping_plan_id) {
            await supabase.from("shopping_plans").update({ completed: false }).eq("id", txn.shopping_plan_id);
            await fetchShoppingPlans();
        }

        await fetchTransactions();
        toast.success("Transaction deleted");
    }

    async function confirmDeleteTransaction() {
        if (!deleteTxId) return;
        const id = deleteTxId;
        setDeleteTxId(null);
        await deleteTransaction(id);
    }

    function startEdit(t) {
        setForm({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category || "",
            date: t.date,
        });
        setEditingId(t.id);
        setFormOpen(true);
    }

    function closeTransactionForm() {
        setFormOpen(false);
        setEditingId(null);
        setShowNewCategory(false);
        setNewCategoryInput("");
        setForm({ title: "", amount: "", type: "expense", category: "", date: new Date().toISOString().split('T')[0] });
    }

    const getTypeStyle = (type) => {
        if (type === 'income') return "bg-accent/10 text-accent";
        if (type === 'expense') return "bg-danger/10 text-danger";
        return "bg-info/10 text-info";
    };

    const getTypeIcon = (type) => {
        if (type === 'income') return <TrendingUp size={15} />;
        if (type === 'expense') return <TrendingDown size={15} />;
        return <IndianRupee size={15} />;
    };

    // ---- Derived data for rendering ----
    const filteredTransactions = transactions.filter(t => {
        const matchSearch = !txSearch || t.title.toLowerCase().includes(txSearch.toLowerCase()) || (t.category || "").toLowerCase().includes(txSearch.toLowerCase());
        const matchLedger = filterLedgers.filter(x => x !== '__open').length === 0 || filterLedgers.filter(x => x !== '__open').includes(t.category || "");
        const matchFrom = !filterFrom || t.date >= filterFrom;
        const matchTo = !filterTo || t.date <= filterTo;
        return matchSearch && matchLedger && matchFrom && matchTo;
    });

    const visibleShopItems = [...shoppingPlans]
        .filter(i => i.name.toLowerCase().includes(shopSearch.toLowerCase()))
        .sort((a, b) => PRIORITY_ORDER[a.priority || 'medium'] - PRIORITY_ORDER[b.priority || 'medium']);

    const txColumns = [
        {
            key: 'title', header: 'Transaction', sortable: true,
            render: (t) => (
                <div className="flex items-center gap-2.5 min-w-[180px]">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeStyle(t.type)}`}>
                        {getTypeIcon(t.type)}
                    </span>
                    <div className="min-w-0">
                        <p className="font-medium text-[var(--text)] truncate">{t.title}</p>
                        <p className="text-xs text-[var(--text-muted)] sm:hidden">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'type', header: 'Type', sortable: true,
            render: (t) => <Badge variant={t.type === 'income' ? 'success' : t.type === 'expense' ? 'danger' : 'info'} className="capitalize">{t.type}</Badge>,
        },
        {
            key: 'category', header: 'Category', sortable: true, sortValue: (t) => t.category || '',
            render: (t) => <Badge variant="neutral">{t.category || 'General'}</Badge>,
        },
        {
            key: 'date', header: 'Date', sortable: true,
            render: (t) => <span className="text-[var(--text-muted)]">{new Date(t.date).toLocaleDateString()}</span>,
        },
        {
            key: 'amount', header: 'Amount', sortable: true, sortValue: (t) => Number(t.amount),
            render: (t) => (
                <span className={`font-semibold tabular-nums ${t.type === 'income' ? 'text-accent' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'actions', header: '',
            render: (t) => (
                <div className="flex items-center gap-1 justify-end">
                    <IconButton label="Edit transaction" size="sm" onClick={() => startEdit(t)}><Edit2 size={14} /></IconButton>
                    <IconButton label="Delete transaction" size="sm" variant="danger" onClick={() => setDeleteTxId(t.id)}><Trash2 size={14} /></IconButton>
                </div>
            ),
        },
    ];

    const shopColumns = [
        {
            key: 'name', header: 'Item', sortable: true,
            render: (item) => (
                <div className="flex items-center gap-3 min-w-[200px]">
                    {item.image_url ? (
                        <img
                            src={item.image_url} alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setLightboxImg(item.image_url)}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <span className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                            <ShoppingCart size={16} />
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="font-medium text-[var(--text)] truncate">{item.name}</p>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {(() => { const p = priorityConfig[item.priority || 'medium']; return (
                                <Badge variant={p.variant}>{p.icon}{p.label}</Badge>
                            ); })()}
                            {item.quantity && <Badge variant="neutral">{item.quantity} {item.unit || 'nos'}</Badge>}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'amount', header: 'Est. Amount', sortable: true, sortValue: (item) => Number(item.amount),
            render: (item) => (
                <span className="font-semibold text-[var(--text)] tabular-nums">
                    ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'actions', header: '',
            render: (item) => (
                <div className="flex items-center gap-1 justify-end">
                    <IconButton
                        label="Edit item"
                        size="sm"
                        disabled={shopLoading}
                        onClick={() => { setEditingShopId(item.id); setEditShopForm({ name: item.name, amount: item.amount, image_url: item.image_url || "", priority: item.priority || "medium", quantity: item.quantity || "", unit: item.unit || "nos" }); }}
                    >
                        <Edit2 size={14} />
                    </IconButton>
                    <IconButton label="Mark as purchased" size="sm" variant="accent" disabled={shopLoading} onClick={() => completeShoppingItem(item)}>
                        <Check size={14} />
                    </IconButton>
                    <IconButton label="Remove item" size="sm" variant="danger" disabled={shopLoading} onClick={() => deleteShoppingItem(item.id)}>
                        <Trash2 size={14} />
                    </IconButton>
                </div>
            ),
        },
    ];

    const txCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    const ledgerNames = [...new Set([
        ...(budgetSaved?.ledgers?.map(l => l.name) || []),
        ...categories,
        ...txCategories
    ])];
    const activeLedgers = filterLedgers.filter(x => x !== '__open');
    const toggleLedger = (n) => setFilterLedgers(prev => {
        const active = prev.filter(x => x !== '__open');
        return active.includes(n) ? active.filter(x => x !== n) : [...active, n];
    });
    const matchDate = (t) => (!filterFrom || t.date >= filterFrom) && (!filterTo || t.date <= filterTo);
    const ledgerFilterIncome = activeLedgers.reduce((sum, ledger) => {
        return sum + transactions.filter(t => (t.category || '') === ledger && t.type === 'income' && matchDate(t)).reduce((s, t) => s + Number(t.amount), 0);
    }, 0);
    const ledgerFilterExpense = activeLedgers.reduce((sum, ledger) => {
        return sum + transactions.filter(t => (t.category || '') === ledger && t.type === 'expense' && matchDate(t)).reduce((s, t) => s + Number(t.amount), 0);
    }, 0);

    if (loading && transactions.length === 0 && shoppingPlans.length === 0 && !budgetSaved) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            <input ref={scanFileRef} type="file" accept="image/*" className="hidden" onChange={handleScanFile} />

            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-accent/10 text-accent">
                    <IndianRupee size={28} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Finance Tracker</h1>
                <p className="text-sm text-[var(--text-muted)]">Transactions, budget and shopping — all in one place.</p>
            </div>

            {/* Tabs */}
            <Tabs
                tabs={[
                    { value: 'transactions', label: 'Transactions' },
                    { value: 'shopping', label: 'Shopping Plan' },
                    { value: 'budget', label: 'Budget Plan' },
                    { value: 'budget-view', label: 'Budget View' },
                    { value: 'ledger-filter', label: 'Ledger Filter' },
                ]}
                value={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === "transactions" && (
                <TransactionsTab
                    scanning={scanning}
                    scanError={scanError}
                    onScanClick={() => scanFileRef.current.click()}
                    onNewTransaction={() => setFormOpen(v => !v)}
                    balanceDetails={balanceDetails}
                    expenseData={expenseData}
                    incomeData={incomeData}
                    txSearch={txSearch}
                    setTxSearch={setTxSearch}
                    txColumns={txColumns}
                    filteredTransactions={filteredTransactions}
                    loading={loading}
                    transactionsCount={transactions.length}
                />
            )}

            {activeTab === "ledger-filter" && (
                <LedgerFilterTab
                    filterFrom={filterFrom} setFilterFrom={setFilterFrom}
                    filterTo={filterTo} setFilterTo={setFilterTo}
                    ledgerNames={ledgerNames}
                    activeLedgers={activeLedgers}
                    toggleLedger={toggleLedger}
                    setFilterLedgers={setFilterLedgers}
                    transactions={transactions}
                    matchDate={matchDate}
                    CHART_COLORS={CHART_COLORS}
                    ledgerFilterIncome={ledgerFilterIncome}
                    ledgerFilterExpense={ledgerFilterExpense}
                />
            )}

            {activeTab === "budget-view" && (
                <BudgetViewTab
                    budgetSaved={budgetSaved}
                    CHART_COLORS={CHART_COLORS}
                    onEditBudget={startEditBudget}
                    onViewTransactions={() => setActiveTab("transactions")}
                    onCreateBudget={() => setActiveTab("budget")}
                />
            )}

            {activeTab === "budget" && (
                <BudgetPlanTab
                    budgetDraft={budgetDraft}
                    loadBudgetDraft={loadBudgetDraft}
                    clearBudgetDraft={clearBudgetDraft}
                    budgetSaved={budgetSaved}
                    budgetEditMode={budgetEditMode}
                    budgetIncome={budgetIncome}
                    updateIncome={updateIncome}
                    budgetLedgers={budgetLedgers}
                    setBudgetLedgers={setBudgetLedgers}
                    categories={categories}
                    loadCategoriesIntoBudget={loadCategoriesIntoBudget}
                    updateLedgerAmount={updateLedgerAmount}
                    updateLedgerPercent={updateLedgerPercent}
                    saveBudgetPlan={saveBudgetPlan}
                    budgetLoading={budgetLoading}
                    cancelEditBudget={cancelEditBudget}
                    saveBudgetDraft={saveBudgetDraft}
                />
            )}

            {activeTab === "shopping" && (
                <ShoppingTab
                    shopForm={shopForm} setShopForm={setShopForm}
                    addShoppingItem={addShoppingItem}
                    shopLoading={shopLoading}
                    UNITS={UNITS}
                    shopColumns={shopColumns}
                    visibleShopItems={visibleShopItems}
                    shopSearch={shopSearch} setShopSearch={setShopSearch}
                    shoppingPlans={shoppingPlans}
                    completedPlans={completedPlans}
                    showCompleted={showCompleted} setShowCompleted={setShowCompleted}
                />
            )}

            <TransactionModal
                formOpen={formOpen}
                closeTransactionForm={closeTransactionForm}
                editingId={editingId}
                createTransaction={createTransaction}
                loading={loading}
                form={form}
                setForm={setForm}
                categories={categories}
                showNewCategory={showNewCategory}
                setShowNewCategory={setShowNewCategory}
                newCategoryInput={newCategoryInput}
                setNewCategoryInput={setNewCategoryInput}
                addCategory={addCategory}
            />

            <DeleteTransactionDialog
                deleteTxId={deleteTxId}
                setDeleteTxId={setDeleteTxId}
                confirmDeleteTransaction={confirmDeleteTransaction}
            />

            <ShoppingItemModal
                editingShopId={editingShopId}
                setEditingShopId={setEditingShopId}
                saveEditShopItem={saveEditShopItem}
                shopLoading={shopLoading}
                UNITS={UNITS}
                editShopForm={editShopForm}
                setEditShopForm={setEditShopForm}
            />

            <ScanReviewModal
                scanReview={scanReview}
                setScanReview={setScanReview}
                discardScanReview={discardScanReview}
                confirmScanReview={confirmScanReview}
                scanSaving={scanSaving}
                scanError={scanError}
                categories={categories}
            />

            <ImageLightbox lightboxImg={lightboxImg} setLightboxImg={setLightboxImg} />
        </div>
    );
}
