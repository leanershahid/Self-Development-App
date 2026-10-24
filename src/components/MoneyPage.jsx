import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
    PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, IndianRupee, Search, Filter,
    Plus, PlusCircle, CheckCircle2, Edit2, Trash2, X, ShoppingCart, Check, AlertCircle, Minus,
    ArrowUp, Wallet, Percent, RefreshCw, Eye, ScanLine, Loader2,
} from "lucide-react";
import CloudinaryUpload from "./CloudinaryUpload";
import Chart from "react-apexcharts";
import { motion, AnimatePresence } from "framer-motion";
import {
    Button, IconButton, Input, DateField, Select, Card, CardHeader, CardBody, Badge, KpiCard, Table,
    Modal, ConfirmDialog, useToast, Tabs, EmptyState, SkeletonCard,
} from "./ui";

const supabaseUrl = "https://qwjujuvtfqahapohhfzs.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const GEMINI_API_KEY = "AQ.Ab8RN6LW2yl3vp7Aib0zssqdloHPwuKr3DFqsVPzwxQR9vhoHA";

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

            {/* ===================== TRANSACTIONS TAB ===================== */}
            {activeTab === "transactions" && (
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
                                    onClick={() => scanFileRef.current.click()}
                                >
                                    {scanning ? "Scanning..." : "Scan Bill"}
                                </Button>
                                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(v => !v)}>
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
                                            title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"}
                                            message={transactions.length === 0 ? "Record your first transaction to start tracking." : "Try adjusting your search or filters."}
                                            action={transactions.length === 0 ? (
                                                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>New Transaction</Button>
                                            ) : undefined}
                                        />
                                    }
                                />
                            </CardBody>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ===================== LEDGER FILTER TAB ===================== */}
            {activeTab === "ledger-filter" && (
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
            )}

            {/* ===================== BUDGET VIEW TAB ===================== */}
            {activeTab === "budget-view" && (
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
                                        <Button variant="secondary" onClick={startEditBudget}>Edit Budget Plan</Button>
                                        <Button variant="ghost" onClick={() => setActiveTab("transactions")}>View Transactions</Button>
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
                                action={<Button variant="primary" onClick={() => setActiveTab("budget")}>Create Budget Plan</Button>}
                            />
                        </Card>
                    )}
                </motion.div>
            )}

            {/* ===================== BUDGET TAB ===================== */}
            {activeTab === "budget" && (
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
            )}

            {/* ===================== SHOPPING TAB ===================== */}
            {activeTab === "shopping" && (
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
            )}

            {/* ===================== New / Edit Transaction Modal ===================== */}
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

            {/* ===================== Delete Transaction Confirm ===================== */}
            <ConfirmDialog
                open={!!deleteTxId}
                onClose={() => setDeleteTxId(null)}
                onConfirm={confirmDeleteTransaction}
                title="Delete transaction"
                message="Are you sure you want to delete this transaction? This cannot be undone."
                confirmLabel="Delete"
            />

            {/* ===================== Edit Shopping Item Modal ===================== */}
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

            {/* ===================== Scan Bill — Review & Confirm ===================== */}
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

            {/* ===================== Image Lightbox ===================== */}
            {lightboxImg && (
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
            )}
        </div>
    );
}
