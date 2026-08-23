import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, IndianRupee, Search, Filter, Plus, PlusCircle, CheckCircle2, Edit2, Trash2, X, ShoppingCart, Check, AlertCircle, Minus, ArrowUp, Wallet, Percent, RefreshCw, Eye, ScanLine, Loader2 } from "lucide-react";
import Navbar from "./NavBar";
import CloudinaryUpload from "./CloudinaryUpload";
import Chart from "react-apexcharts";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = "https://quufeiwzsgiuwkeyjjns.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg";

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
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState("transactions");
    const [budgetViewMode, setBudgetViewMode] = useState("create"); // "create" or "view"
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
        high:   { label: "High",   color: "text-rose-400",   border: "border-rose-500/40",   bg: "bg-rose-500/10",   icon: <ArrowUp size={11} /> },
        medium: { label: "Medium", color: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/10", icon: <Minus size={11} /> },
        low:    { label: "Low",    color: "text-slate-400",  border: "border-slate-500/40",  bg: "bg-slate-500/10",  icon: <AlertCircle size={11} /> },
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

    const NEON_COLORS = [
        '#00e5ff', // cyan
        '#7c4dff', // purple
        '#ff3366', // rose
        '#00e676', // emerald
        '#ffea00', // yellow
        '#ff9100', // orange
        '#00b0ff'  // light blue
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
        } catch (err) {
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
    }

    function saveBudgetDraft() {
        const ledgers = budgetLedgers.filter(l => l.name.trim() || l.percent);
        if (!budgetIncome && ledgers.length === 0) return;
        const draft = { income: budgetIncome, ledgers: budgetLedgers };
        localStorage.setItem("budget_draft", JSON.stringify(draft));
        setBudgetDraft(draft);
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
    }

    async function deleteShoppingItem(id) {
        setShopLoading(true);
        await supabase.from("shopping_plans").delete().eq("id", id);
        await fetchShoppingPlans();
        setShopLoading(false);
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
                chart: { type: 'donut', background: 'transparent', foreColor: '#94a3b8' },
                labels: sortedExp.map(d => d.name),
                colors: NEON_COLORS,
                stroke: { show: false },
                dataLabels: { enabled: false },
                legend: {
                    position: 'bottom',
                    fontFamily: 'monospace',
                    labels: { colors: '#94a3b8' }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '75%',
                            background: 'transparent',
                            labels: {
                                show: true,
                                name: { show: true, fontSize: '12px', fontFamily: 'monospace', color: '#64748b' },
                                value: {
                                    show: true,
                                    fontSize: '20px',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                    formatter: (val) => `₹${Number(val).toLocaleString()}`
                                },
                                total: {
                                    show: true,
                                    label: 'EXPENSES',
                                    fontFamily: 'monospace',
                                    color: '#64748b',
                                    formatter: () => `₹${expense.toLocaleString()}`
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setIncomeData({
            series: [{
                name: 'Volume',
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
                colors: NEON_COLORS.slice().reverse(),
                dataLabels: { enabled: false },
                xaxis: {
                    categories: sortedInc.map(d => d.name),
                    labels: {
                        style: { colors: '#94a3b8', fontFamily: 'monospace' },
                        formatter: (val) => `₹${val}`
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { style: { colors: '#1e293b', fontFamily: 'monospace' } }
                },
                grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                tooltip: {
                    theme: 'dark',
                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                }
            }
        });

        setLoading(false);
    }

    async function createTransaction(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.amount) return;

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
    }

    async function deleteTransaction(id) {
        if (!window.confirm("Are you sure you want to scrub this record?")) return;

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const getTypeStyle = (type) => {
        if (type === 'income') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        if (type === 'expense') return "bg-rose-500/10 text-rose-400 border-rose-500/30";
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    };

    const getTypeIcon = (type) => {
        if (type === 'income') return <TrendingUp size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />;
        if (type === 'expense') return <TrendingDown size={20} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />;
        return <IndianRupee size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] text-slate-200">
            <Navbar />
            <style>{`
        .dash-glass { background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .dash-input { background: rgba(255,255,255,0.5); border: 1px solid rgba(112,145,230,0.35); color: #3D52A0; transition: all 0.3s ease; }
        .dash-input:focus { border-color: rgba(34,211,238,0.5); box-shadow: 0 0 10px rgba(34,211,238,0.2); outline: none; }
        .dash-btn { background: linear-gradient(to right, rgba(14,165,233,0.8), rgba(59,130,246,0.8)); color: white; border: 1px solid rgba(14,165,233,0.5); transition: all 0.3s ease; }
        .dash-btn:hover { background: linear-gradient(to right, rgba(14,165,233,1), rgba(59,130,246,1)); box-shadow: 0 0 15px rgba(14,165,233,0.4); }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8 dash-glass p-1 rounded-xl w-fit flex-wrap">
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "transactions"
                                ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><IndianRupee size={13} /> Finance Vault</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("shopping")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "shopping"
                                ? "bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-violet-300 border border-violet-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><ShoppingCart size={13} /> Shopping Plan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("budget")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "budget"
                                ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><Wallet size={13} /> Budget Plan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("budget-view")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "budget-view"
                                ? "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><Eye size={13} /> Budget View</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("ledger-filter")}
                        className={`px-5 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-all ${
                            activeTab === "ledger-filter"
                                ? "bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-cyan-300 border border-cyan-500/30"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><Filter size={13} /> Ledger Filter</span>
                    </button>
                </div>

                {activeTab === "transactions" && <>
                {/* Header + Overview */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-10 relative"
                >
                    <input ref={scanFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanFile} />

                    <div className="absolute right-0 top-0 hidden md:flex gap-2 group">
                        <button
                            onClick={() => scanFileRef.current.click()}
                            disabled={scanning}
                            className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 text-xs tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20"
                        >
                            {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                            {scanning ? "Scanning..." : "Scan Bill"}
                        </button>
                        <button
                            onClick={() => setFormOpen(!formOpen)}
                            className="dash-btn px-6 py-3 rounded-xl font-semibold flex items-center gap-2 text-xs tracking-widest uppercase transition-all hover:scale-105"
                        >
                            <Plus size={16} />
                            New Transaction
                        </button>
                    </div>

                    <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                        <IndianRupee size={42} strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
                        Finance Vault
                    </h1>
                    <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase mb-6 md:mb-0">
                        Asset Tracking & Capital Flow
                    </p>

                    {scanError && (
                        <p className="text-rose-400 text-xs font-mono mt-3">{scanError}</p>
                    )}

                    <div className="md:hidden mt-6 flex gap-2">
                        <button
                            onClick={() => scanFileRef.current.click()}
                            disabled={scanning}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs tracking-widest uppercase transition-all disabled:opacity-50 bg-indigo-500/10 border border-indigo-500/40 text-indigo-400"
                        >
                            {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                            {scanning ? "Scanning..." : "Scan Bill"}
                        </button>
                        <button
                            onClick={() => setFormOpen(!formOpen)}
                            className="flex-1 dash-btn px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
                        >
                            <Plus size={16} />
                            New
                        </button>
                    </div>
                </motion.div>

                {/* Balance Overview Cards */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-cyan-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute right-[-20%] top-[-20%] opacity-10">
                            <IndianRupee size={150} />
                        </div>
                        <p className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-2">Net Balance</p>
                        <h2 className={`text-4xl font-bold ${balanceDetails.totalBalance >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                            ₹{balanceDetails.totalBalance.toLocaleString()}
                        </h2>
                    </div>
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-emerald-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="text-xs font-mono tracking-widest text-emerald-400/70 uppercase mb-2">Total Income</p>
                        <h2 className="text-3xl font-bold text-emerald-400">
                            ₹{balanceDetails.totalIncome.toLocaleString()}
                        </h2>
                        <TrendingUp className="absolute bottom-4 right-4 text-emerald-500/20" size={40} />
                    </div>
                    <div className="dash-glass p-6 rounded-2xl border-l-[4px] border-l-rose-500 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="text-xs font-mono tracking-widest text-rose-400/70 uppercase mb-2">Total Expenses</p>
                        <h2 className="text-3xl font-bold text-rose-400">
                            ₹{balanceDetails.totalExpense.toLocaleString()}
                        </h2>
                        <TrendingDown className="absolute bottom-4 right-4 text-rose-500/20" size={40} />
                    </div>
                </motion.div>

                {/* Create Transaction Form */}
                {formOpen && (
                    <div className="mb-12 dash-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>

                        <h2 className="text-xl font-bold text-gray-200 mb-8 flex items-center gap-3 pb-4 border-b border-white/5">
                            {editingId ? <Edit2 className="text-emerald-400" size={24} /> : <PlusCircle className="text-emerald-400" size={24} />}
                            {editingId ? "Update Capital Transfer" : "Register Capital Transfer"}
                        </h2>

                        <form onSubmit={createTransaction} className="grid gap-6 md:grid-cols-2">
                            {/* Title */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Transaction Origin/Target *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Salary, Groceries, Rent"
                                    className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Amount */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Value (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Flow Vector</label>
                                <select
                                    className="dash-input w-full px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                >
                                    <option value="expense" className="bg-gray-900">Outbound (Expense)</option>
                                    <option value="income" className="bg-gray-900">Inbound (Income)</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div className="relative">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Class Index</label>
                                {!showNewCategory ? (
                                    <div className="flex gap-2">
                                        <select
                                            className="dash-input flex-1 px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-emerald-500/50"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                        >
                                            <option value="" className="bg-gray-900">-- Select Class Index --</option>
                                            {categories.map(c => (
                                                <option key={c} value={c} className="bg-gray-900">{c}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCategory(true)}
                                            className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                            title="Create new category"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="New class name..."
                                            className="dash-input flex-1 px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                            value={newCategoryInput}
                                            onChange={(e) => setNewCategoryInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory(newCategoryInput))}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addCategory(newCategoryInput)}
                                            className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowNewCategory(false); setNewCategoryInput(""); }}
                                            className="px-3 py-2 rounded-xl bg-gray-700/50 border border-white/10 text-gray-400 hover:bg-gray-700 transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div className="relative md:col-span-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Timestamp</label>
                                <input
                                    type="date"
                                    className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500/50"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-6 md:col-span-2 pt-6 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={loading || !form.title.trim() || !form.amount}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-50 transition-all border border-emerald-500/50"
                                >
                                    {loading ? "Processing..." : editingId ? "Save Changes" : "Commit Transaction"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormOpen(false);
                                        setEditingId(null);
                                        setShowNewCategory(false);
                                        setNewCategoryInput("");
                                        setForm({ title: "", amount: "", type: "expense", category: "", date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="flex-1 px-8 py-3.5 bg-gray-900/50 hover:bg-gray-800 text-gray-400 border border-white/10 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                                >
                                    Abort
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Charts Overview */}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
                >
                    {/* Expenses Doughnut Chart */}
                    <div className="dash-glass p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-rose-400" />
                            Ledger: Outbound Flow
                        </h3>
                        {expenseData.series?.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <Chart
                                    options={expenseData.options}
                                    series={expenseData.series}
                                    type="donut"
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                                No outbound flow detected
                            </div>
                        )}
                    </div>

                    {/* Income Bar Chart */}
                    <div className="dash-glass p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-emerald-400" />
                            Ledger: Inbound Channels
                        </h3>
                        {incomeData.series?.[0]?.data?.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <Chart
                                    options={incomeData.options}
                                    series={incomeData.series}
                                    type="bar"
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                                No inbound signal detected
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Transactions List */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <Filter size={20} className="text-cyan-400" />
                        Ledger History
                    </h3>
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="dash-input w-full pl-9 pr-4 py-2 rounded-xl text-sm placeholder-gray-600"
                            value={txSearch}
                            onChange={(e) => setTxSearch(e.target.value)}
                        />
                    </div>
                </div>
                {
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                                <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase animate-pulse">Syncing Ledger...</div>
                            </div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20 dash-glass rounded-3xl mt-8">
                            <div className="inline-flex items-center justify-center p-6 bg-gray-900/50 border border-white/5 rounded-3xl mb-6">
                                <Search className="text-gray-600" size={56} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-300 mb-2">No Transactions Detected</h3>
                            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-8">Initiate capital flow to view records</p>
                            <button
                                onClick={() => setFormOpen(true)}
                                className="px-8 py-4 dash-btn bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 rounded-xl font-semibold text-xs tracking-widest uppercase border-emerald-500/50"
                            >
                                Execute First Transfer
                            </button>
                        </div>
                    ) : (
                        <div className="dash-glass rounded-2xl overflow-hidden">
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-400">
                                <div className="col-span-1 text-center">Dir</div>
                                <div className="col-span-4">Entity/Details</div>
                                <div className="col-span-2">Class</div>
                                <div className="col-span-2 text-right">Date</div>
                                <div className="col-span-2 text-right">Volume</div>
                                <div className="col-span-1 text-center">Actions</div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {transactions.filter(t => {
                                    const matchSearch = !txSearch || t.title.toLowerCase().includes(txSearch.toLowerCase()) || (t.category || "").toLowerCase().includes(txSearch.toLowerCase());
                                    const matchLedger = filterLedgers.filter(x => x !== '__open').length === 0 || filterLedgers.filter(x => x !== '__open').includes(t.category || "");
                                    const matchFrom = !filterFrom || t.date >= filterFrom;
                                    const matchTo = !filterTo || t.date <= filterTo;
                                    return matchSearch && matchLedger && matchFrom && matchTo;
                                }).map((t) => (
                                    <div key={t.id} className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.02] transition-colors group">
                                        <div className="hidden md:flex col-span-1 justify-center">
                                            {getTypeIcon(t.type)}
                                        </div>

                                        <div className="col-span-4 mb-2 md:mb-0 flex items-center gap-3">
                                            <div className="md:hidden">
                                                {getTypeIcon(t.type)}
                                            </div>
                                            <div>
                                                <p className="text-[#3D52A0] font-medium group-hover:text-cyan-400 transition-colors">{t.title}</p>
                                                <p className="text-xs text-gray-500 md:hidden mt-0.5">{new Date(t.date).toLocaleDateString()} &bull; {t.category || 'Uncategorized'}</p>
                                            </div>
                                        </div>

                                        <div className="hidden md:block col-span-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border border-white/10 bg-white/5 text-gray-300`}>
                                                {t.category || "General"}
                                            </span>
                                        </div>

                                        <div className="hidden md:block col-span-2 text-right text-sm text-gray-400 font-mono">
                                            {new Date(t.date).toLocaleDateString()}
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span className={`text-lg md:text-xl font-bold font-mono tracking-wide ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="hidden md:flex col-span-1 justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(t)} className="text-cyan-400 hover:text-cyan-300">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteTransaction(t.id)} className="text-rose-500 hover:text-rose-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="md:hidden mt-4 pt-4 border-t border-white/5 flex gap-4 w-full">
                                            <button onClick={() => startEdit(t)} className="flex-1 py-2 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono tracking-widest uppercase border border-cyan-500/20 flex items-center justify-center gap-2">
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button onClick={() => deleteTransaction(t.id)} className="flex-1 py-2 rounded bg-rose-500/10 text-rose-500 text-xs font-mono tracking-widest uppercase border border-rose-500/20 flex items-center justify-center gap-2">
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
                </>
                }

                {activeTab === "ledger-filter" && (() => {
                    const txCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
                    const ledgerNames = [...new Set([
                        ...(budgetSaved?.ledgers?.map(l => l.name) || []),
                        ...categories,
                        ...txCategories
                    ])];
                    const activeLedgers = filterLedgers.filter(x => x !== '__open');
                    const toggle = (n) => setFilterLedgers(prev => {
                        const active = prev.filter(x => x !== '__open');
                        return active.includes(n) ? active.filter(x => x !== n) : [...active, n];
                    });

                    const matchDate = (t) => (!filterFrom || t.date >= filterFrom) && (!filterTo || t.date <= filterTo);

                    const totalIncome = activeLedgers.reduce((sum, ledger) => {
                        return sum + transactions.filter(t => (t.category || '') === ledger && t.type === 'income' && matchDate(t)).reduce((s, t) => s + Number(t.amount), 0);
                    }, 0);
                    const totalExpense = activeLedgers.reduce((sum, ledger) => {
                        return sum + transactions.filter(t => (t.category || '') === ledger && t.type === 'expense' && matchDate(t)).reduce((s, t) => s + Number(t.amount), 0);
                    }, 0);

                    return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                    <Filter size={42} strokeWidth={2} />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">Ledger Filter</h1>
                                <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase">Select ledgers to view totals</p>
                            </div>

                            {/* Date range */}
                            <div className="dash-glass rounded-2xl p-5 mb-4">
                                <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-3">Date Range</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500">From</label>
                                        <input type="date" className="dash-input px-3 py-2 rounded-xl text-sm w-full" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-gray-500">To</label>
                                        <input type="date" className="dash-input px-3 py-2 rounded-xl text-sm w-full" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                                    </div>
                                    {(filterFrom || filterTo) && (
                                        <div className="flex items-end">
                                            <button onClick={() => { setFilterFrom(''); setFilterTo(''); }}
                                                className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono tracking-widest uppercase hover:bg-rose-500/20 transition-all flex items-center gap-1"
                                            >
                                                <X size={12} /> Clear
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ledger pill toggles */}
                            <div className="dash-glass rounded-2xl p-5 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400">Select Ledgers</p>
                                    {activeLedgers.length > 0 && (
                                        <button onClick={() => setFilterLedgers([])}
                                            className="text-[10px] font-mono tracking-widest uppercase text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                                        >
                                            <X size={10} /> Clear all
                                        </button>
                                    )}
                                </div>
                                {ledgerNames.length === 0 ? (
                                    <p className="text-gray-500 font-mono text-xs">No ledgers found. Add transactions with categories first.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {ledgerNames.map(n => {
                                            const active = activeLedgers.includes(n);
                                            const txCount = transactions.filter(t => (t.category || '') === n).length;
                                            return (
                                                <button key={n} onClick={() => toggle(n)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-widest uppercase border transition-all ${
                                                        active
                                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-cyan-500/30 hover:text-gray-200'
                                                    }`}
                                                >
                                                    {active && <CheckCircle2 size={11} className="text-cyan-400" />}
                                                    {n}
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-gray-500'}`}>{txCount}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Per-ledger cards */}
                            {activeLedgers.length === 0 ? (
                                <div className="text-center py-16 dash-glass rounded-3xl">
                                    <Filter className="mx-auto text-gray-600 mb-4" size={48} strokeWidth={1.5} />
                                    <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">Select ledgers above to view totals</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {activeLedgers.map((ledger, idx) => {
                                            const txns = transactions.filter(t => (t.category || '') === ledger && matchDate(t));
                                            const inc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
                                            const exp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
                                            const net = inc - exp;
                                            const color = NEON_COLORS[idx % NEON_COLORS.length];
                                            return (
                                                <div key={ledger} className="dash-glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-mono tracking-widest uppercase text-sm font-bold truncate" style={{ color }}>{ledger}</h3>
                                                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{txns.length} txn{txns.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-mono text-emerald-400/70 uppercase tracking-widest">Income</span>
                                                            <span className="text-base font-bold text-emerald-400 font-mono">₹{inc.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-mono text-rose-400/70 uppercase tracking-widest">Expense</span>
                                                            <span className="text-base font-bold text-rose-400 font-mono">₹{exp.toLocaleString()}</span>
                                                        </div>
                                                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                                            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Net</span>
                                                            <span className={`text-xl font-bold font-mono ${net >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>₹{net.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Combined totals */}
                                    {activeLedgers.length > 1 && (
                                        <div className="dash-glass rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0" />
                                            <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/70 mb-4">Combined Total — {activeLedgers.length} Ledgers</p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/70 mb-1">Total Income</p>
                                                    <p className="text-2xl font-bold text-emerald-400 font-mono">₹{totalIncome.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-mono tracking-widest uppercase text-rose-400/70 mb-1">Total Expense</p>
                                                    <p className="text-2xl font-bold text-rose-400 font-mono">₹{totalExpense.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/70 mb-1">Net Balance</p>
                                                    <p className={`text-2xl font-bold font-mono ${totalIncome - totalExpense >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>₹{(totalIncome - totalExpense).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    );
                })()}

                {activeTab === "budget-view" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                                <Eye size={42} strokeWidth={2} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">Budget Analysis</h1>
                            <p className="text-emerald-400/60 font-mono text-sm tracking-widest uppercase">Financial Allocation Overview</p>
                        </div>

                        {budgetSaved ? (
                            <div className="space-y-6">
                                {/* Budget Overview Card */}
                                <div className="dash-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-white/5">
                                        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-3">
                                            <Wallet className="text-emerald-400" size={24} />
                                            Active Budget Plan
                                        </h2>
                                        <div className="text-right mt-2 md:mt-0">
                                            <p className="text-xs font-mono tracking-widest uppercase text-gray-400">Monthly Income</p>
                                            <p className="text-2xl font-bold text-emerald-400 font-mono">₹{Number(budgetSaved.income).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Ledgers Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                        {budgetSaved.ledgers.map((ledger, i) => {
                                            const savedAmount = ledger.amount || ((Number(budgetSaved.income) * Number(ledger.percent)) / 100);
                                            const color = NEON_COLORS[i % NEON_COLORS.length];
                                            
                                            return (
                                                <div key={i} className="dash-glass rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all group">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="text-[#3D52A0] font-medium text-sm truncate group-hover:text-emerald-400 transition-colors">{ledger.name}</h3>
                                                        <span className="text-emerald-400 font-mono text-xs shrink-0 ml-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                            {ledger.percent}%
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <div className="text-2xl font-bold text-emerald-300 font-mono mb-1">
                                                            ₹{savedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </div>
                                                        <div className="text-xs text-gray-400 font-mono">
                                                            per month
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                            <div 
                                                                className="h-full rounded-full transition-all duration-500" 
                                                                style={{ 
                                                                    width: `${Math.min(ledger.percent, 100)}%`,
                                                                    background: `linear-gradient(90deg, ${color}, ${color}80)`
                                                                }} 
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-xs font-mono text-gray-500">
                                                            <span>Daily: ₹{(savedAmount / 30).toFixed(0)}</span>
                                                            <span>Weekly: ₹{(savedAmount / 4.33).toFixed(0)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Budget Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(() => {
                                            const totalPercent = budgetSaved.ledgers.reduce((s, l) => s + Number(l.percent), 0);
                                            const totalAllocated = budgetSaved.ledgers.reduce((s, l) => s + (Number(l.amount) || ((Number(budgetSaved.income) * Number(l.percent)) / 100)), 0);
                                            const remaining = Number(budgetSaved.income) - totalAllocated;
                                            
                                            return (
                                                <>
                                                    <div className="dash-glass rounded-xl p-4 border-l-4 border-l-emerald-500">
                                                        <p className="text-xs font-mono tracking-widest uppercase text-emerald-400/70 mb-1">Total Allocated</p>
                                                        <p className="text-xl font-bold text-emerald-400 font-mono">₹{totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-1">{totalPercent.toFixed(1)}% of income</p>
                                                    </div>
                                                    
                                                    <div className={`dash-glass rounded-xl p-4 border-l-4 ${remaining >= 0 ? 'border-l-cyan-500' : 'border-l-rose-500'}`}>
                                                        <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">Remaining</p>
                                                        <p className={`text-xl font-bold font-mono ${remaining >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                                                            ₹{Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-mono mt-1">
                                                            {remaining >= 0 ? 'Available' : 'Over budget'}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="dash-glass rounded-xl p-4 border-l-4 border-l-amber-500">
                                                        <p className="text-xs font-mono tracking-widest uppercase text-amber-400/70 mb-1">Ledgers Count</p>
                                                        <p className="text-xl font-bold text-amber-400 font-mono">{budgetSaved.ledgers.length}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-1">Active categories</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Budget Breakdown Chart */}
                                <div className="dash-glass rounded-2xl p-6 relative overflow-hidden">
                                    <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                                        <PieChartIcon size={20} className="text-emerald-400" />
                                        Budget Allocation Breakdown
                                    </h3>
                                    
                                    {(() => {
                                        const chartData = {
                                            series: budgetSaved.ledgers.map(l => l.amount || ((Number(budgetSaved.income) * Number(l.percent)) / 100)),
                                            options: {
                                                chart: { type: 'donut', background: 'transparent', foreColor: '#94a3b8' },
                                                labels: budgetSaved.ledgers.map(l => l.name),
                                                colors: NEON_COLORS,
                                                stroke: { show: false },
                                                dataLabels: { enabled: false },
                                                legend: {
                                                    position: 'bottom',
                                                    fontFamily: 'monospace',
                                                    labels: { colors: '#94a3b8' }
                                                },
                                                plotOptions: {
                                                    pie: {
                                                        donut: {
                                                            size: '70%',
                                                            background: 'transparent',
                                                            labels: {
                                                                show: true,
                                                                name: { show: true, fontSize: '12px', fontFamily: 'monospace', color: '#64748b' },
                                                                value: {
                                                                    show: true,
                                                                    fontSize: '20px',
                                                                    fontFamily: 'monospace',
                                                                    fontWeight: 'bold',
                                                                    color: '#1e293b',
                                                                    formatter: (val) => `₹${Number(val).toLocaleString()}`
                                                                },
                                                                total: {
                                                                    show: true,
                                                                    label: 'BUDGET',
                                                                    fontFamily: 'monospace',
                                                                    color: '#64748b',
                                                                    formatter: () => `₹${Number(budgetSaved.income).toLocaleString()}`
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                tooltip: {
                                                    theme: 'dark',
                                                    y: { formatter: (val) => `₹${val.toLocaleString()}` }
                                                }
                                            }
                                        };
                                        
                                        return (
                                            <div className="h-[400px] w-full">
                                                <Chart
                                                    options={chartData.options}
                                                    series={chartData.series}
                                                    type="donut"
                                                    height="100%"
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Quick Actions */}
                                <div className="dash-glass rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                        <Plus size={18} className="text-emerald-400" />
                                        Quick Actions
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={startEditBudget}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 text-emerald-400 rounded-xl text-xs font-semibold tracking-widest uppercase border border-emerald-500/30 transition-all"
                                        >
                                            Edit Budget Plan
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("transactions")}
                                            className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-400 rounded-xl text-xs font-semibold tracking-widest uppercase border border-cyan-500/30 transition-all"
                                        >
                                            View Transactions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 dash-glass rounded-3xl">
                                <div className="inline-flex items-center justify-center p-6 bg-gray-900/50 border border-white/5 rounded-3xl mb-6">
                                    <Wallet className="text-gray-600" size={56} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-300 mb-2">No Budget Plan Found</h3>
                                <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-8">Create a budget plan to view analysis</p>
                                <button
                                    onClick={() => setActiveTab("budget")}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-semibold text-xs tracking-widest uppercase border border-emerald-500/50 transition-all"
                                >
                                    Create Budget Plan
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "budget" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                <Wallet size={42} strokeWidth={2} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">Budget Plan</h1>
                            <p className="text-amber-400/60 font-mono text-sm tracking-widest uppercase">Split Income Into Ledgers</p>
                        </div>

                        {budgetDraft && (
                            <div className="dash-glass rounded-2xl p-4 mb-6 border border-slate-500/30 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-slate-500/20 border border-slate-500/40 text-slate-300">Draft</span>
                                    <span className="text-sm text-slate-300">
                                        Income: <span className="text-amber-400 font-mono font-bold">₹{Number(budgetDraft.income || 0).toLocaleString()}</span>
                                        <span className="text-slate-500 mx-2">·</span>
                                        {budgetDraft.ledgers?.filter(l => l.name).length || 0} ledger{(budgetDraft.ledgers?.filter(l => l.name).length || 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={loadBudgetDraft}
                                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-widest uppercase hover:bg-amber-500/20 transition-all"
                                    >
                                        Load Draft
                                    </button>
                                    <button
                                        onClick={clearBudgetDraft}
                                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono tracking-widest uppercase hover:bg-rose-500/20 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {budgetSaved && (
                            <div className="dash-glass rounded-2xl p-6 mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-mono tracking-widest uppercase text-amber-400">Active Budget Plan</h3>
                                    <span className="text-xs font-mono text-gray-400">Total Income: <span className="text-emerald-400 font-bold">₹{Number(budgetSaved.income).toLocaleString()}</span></span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {budgetSaved.ledgers.map((l, i) => {
                                        const savedAmount = l.amount || ((Number(budgetSaved.income) * Number(l.percent)) / 100);
                                        return (
                                            <div key={i} className="dash-glass rounded-xl p-4 border border-amber-500/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[#3D52A0] font-medium text-sm">{l.name}</span>
                                                    <span className="text-amber-400 font-mono text-xs">{l.percent}%</span>
                                                </div>
                                                <div className="text-2xl font-bold text-amber-300 font-mono">₹{savedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(l.percent, 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(() => {
                                    const total = budgetSaved.ledgers.reduce((s, l) => s + Number(l.percent), 0);
                                    return total !== 100
                                        ? <p className="mt-3 text-xs font-mono text-rose-400">⚠ Ledgers sum to {total}% (should be 100%)</p>
                                        : <p className="mt-3 text-xs font-mono text-emerald-400">✓ 100% allocated</p>;
                                })()}
                            </div>
                        )}

                        <div className="dash-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-50"></div>
                            <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                                <Percent className="text-amber-400" size={22} />
                                {budgetEditMode ? "Update Budget Plan" : budgetSaved ? "Update Budget Plan" : "Create Budget Plan"}
                            </h2>
                            <form onSubmit={saveBudgetPlan} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Total Monthly Income (₹) *</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="e.g. 50000"
                                        className="dash-input w-full md:w-64 px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={budgetIncome}
                                        onChange={(e) => updateIncome(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400">Ledgers (must total 100%)</label>
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={loadCategoriesIntoBudget}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-widest uppercase hover:bg-cyan-500/20 transition-all"
                                                title="Load transaction categories as ledgers"
                                            >
                                                <RefreshCw size={12} /> Sync Categories
                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setBudgetLedgers(l => [...l, { name: "", percent: "", amount: "" }])}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-widest uppercase hover:bg-amber-500/20 transition-all"
                                                            >
                                                                <Plus size={12} /> Add Ledger
                                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {/* Desktop header */}
                                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-mono tracking-widest uppercase text-gray-500 px-1 mb-3">
                                            <div className="col-span-6">Ledger Name</div>
                                            <div className="col-span-3 text-center">Amount (₹)</div>
                                            <div className="col-span-2 text-center">Percent</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {budgetLedgers.map((l, i) => (
                                            <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center p-3 md:p-0 rounded-xl md:rounded-none bg-white/[0.02] md:bg-transparent border border-white/5 md:border-0">
                                                {/* Mobile label */}
                                                <div className="flex items-center justify-between md:hidden mb-1">
                                                    <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500">Ledger {i + 1}</span>
                                                    {budgetLedgers.length > 1 && (
                                                        <button type="button" onClick={() => setBudgetLedgers(ls => ls.filter((_, j) => j !== i))}
                                                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="col-span-6 relative">
                                                    <input
                                                        type="text" placeholder="Ledger name (e.g. Savings)"
                                                        className="dash-input w-full px-4 py-2.5 rounded-xl placeholder-gray-600 text-sm"
                                                        value={l.name}
                                                        onChange={(e) => setBudgetLedgers(ls => ls.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                                        list={`categories-${i}`}
                                                    />
                                                    <datalist id={`categories-${i}`}>
                                                        {categories.map(cat => (
                                                            <option key={cat} value={cat} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="flex gap-2 md:contents">
                                                    <div className="col-span-3 relative flex-1">
                                                        <label className="md:hidden text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1 block">Amount</label>
                                                        <input
                                                            type="number" min="0" step="1" placeholder="Amount"
                                                            className="dash-input w-full px-4 py-2.5 rounded-xl placeholder-gray-600 text-sm pr-8"
                                                            value={l.amount}
                                                            onChange={(e) => updateLedgerAmount(i, e.target.value)}
                                                        />
                                                        <span className="absolute right-3 bottom-2.5 text-gray-500 text-xs">₹</span>
                                                    </div>
                                                    <div className="col-span-2 relative flex-1">
                                                        <label className="md:hidden text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1 block">Percent</label>
                                                        <input
                                                            type="number" min="0" max="100" step="0.1" placeholder="%"
                                                            className="dash-input w-full px-3 py-2.5 rounded-xl placeholder-gray-600 text-sm pr-6"
                                                            value={l.percent}
                                                            onChange={(e) => updateLedgerPercent(i, e.target.value)}
                                                        />
                                                        <span className="absolute right-2 bottom-2.5 text-gray-500 text-xs">%</span>
                                                    </div>
                                                </div>
                                                {/* Desktop delete */}
                                                <div className="col-span-1 hidden md:flex justify-center">
                                                    {budgetLedgers.length > 1 && (
                                                        <button type="button" onClick={() => setBudgetLedgers(ls => ls.filter((_, j) => j !== i))}
                                                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {budgetLedgers.some(l => l.percent || l.amount) && (() => {
                                        const totalPercent = budgetLedgers.reduce((s, l) => s + (Number(l.percent) || 0), 0);
                                        const totalAmount = budgetLedgers.reduce((s, l) => s + (Number(l.amount) || 0), 0);
                                        const income = Number(budgetIncome) || 0;
                                        
                                        return (
                                            <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                                    <div>
                                                        <span className="text-gray-400">Total Allocated: </span>
                                                        <span className={totalAmount === income ? 'text-emerald-400' : totalAmount > income ? 'text-rose-400' : 'text-amber-400'}>
                                                            ₹{totalAmount.toLocaleString()}
                                                        </span>
                                                        {income > 0 && (
                                                            <span className="text-gray-500 ml-2">
                                                                ({totalAmount > 0 ? ((totalAmount / income) * 100).toFixed(1) : '0'}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-gray-400">Remaining: </span>
                                                        <span className={income - totalAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            ₹{(income - totalAmount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {totalPercent !== 100 && (
                                                    <p className={`mt-2 text-xs font-mono ${totalPercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        Percentage Total: {totalPercent.toFixed(1)}% {totalPercent === 100 ? '✓' : `(${100 - totalPercent > 0 ? `${(100 - totalPercent).toFixed(1)}% remaining` : `${(totalPercent - 100).toFixed(1)}% over`})`}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <button
                                        type="submit" disabled={budgetLoading}
                                        className="px-8 py-3 bg-gradient-to-r from-amber-500/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase border border-amber-500/50 transition-all disabled:opacity-50"
                                    >
                                        {budgetLoading ? "Saving..." : budgetEditMode ? "Update Budget Plan" : "Save Budget Plan"}
                                    </button>
                                    {budgetEditMode && (
                                        <button
                                            type="button"
                                            onClick={cancelEditBudget}
                                            className="px-6 py-3 bg-gray-700/60 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold tracking-widest uppercase border border-gray-500/40 transition-all"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={saveBudgetDraft}
                                        className="px-6 py-3 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold tracking-widest uppercase border border-slate-500/40 transition-all"
                                    >
                                        Save as Draft
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {activeTab === "shopping" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        {/* Header */}
                        <div className="text-center mb-10 relative">
                            <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                                <ShoppingCart size={42} strokeWidth={2} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">Shopping Plan</h1>
                            <p className="text-violet-400/60 font-mono text-sm tracking-widest uppercase">Plan Before You Spend</p>
                        </div>

                        {/* Add Form */}
                        <div className="dash-glass rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0 opacity-50"></div>
                            <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                                <ShoppingCart className="text-violet-400" size={22} />
                                Add Shopping Item
                            </h2>
                            <form onSubmit={addShoppingItem} className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Item Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Groceries, Shoes"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.name}
                                        onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Est. Amount (₹) *</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.amount}
                                        onChange={(e) => setShopForm({ ...shopForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Priority</label>
                                    <select
                                        className="dash-input w-full px-4 py-3 rounded-xl appearance-none"
                                        value={shopForm.priority}
                                        onChange={(e) => setShopForm({ ...shopForm, priority: e.target.value })}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                    >
                                        <option value="high" className="bg-gray-900">🔴 High</option>
                                        <option value="medium" className="bg-gray-900">🟡 Medium</option>
                                        <option value="low" className="bg-gray-900">⚪ Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Quantity</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="e.g. 2"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600"
                                        value={shopForm.quantity}
                                        onChange={(e) => setShopForm({ ...shopForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Unit</label>
                                    <select
                                        className="dash-input w-full px-4 py-3 rounded-xl appearance-none"
                                        value={shopForm.unit}
                                        onChange={(e) => setShopForm({ ...shopForm, unit: e.target.value })}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                    >
                                        {UNITS.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Item Image</label>
                                    <CloudinaryUpload
                                        label="Upload Image"
                                        currentUrl={shopForm.image_url}
                                        onUpload={(url) => setShopForm(f => ({ ...f, image_url: url }))}
                                    />
                                </div>
                                <div className="flex items-end md:col-start-3">
                                    <button type="submit" disabled={shopLoading}
                                        className="w-full py-3 bg-gradient-to-r from-violet-500/80 to-purple-600/80 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase border border-violet-500/50 transition-all disabled:opacity-50"
                                    >
                                        <span className="flex items-center justify-center gap-2"><Plus size={14} /> Add to Plan</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Search + Total bar */}
                        <div className="dash-glass rounded-2xl px-6 py-4 mb-4 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    className="dash-input w-full pl-9 pr-4 py-2 rounded-xl text-sm placeholder-gray-600"
                                    value={shopSearch}
                                    onChange={(e) => setShopSearch(e.target.value)}
                                />
                            </div>
                            {shoppingPlans.length > 0 && (
                                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                                    <span className="text-xs font-mono tracking-widest uppercase text-gray-400">{shoppingPlans.length} item{shoppingPlans.length !== 1 ? 's' : ''}</span>
                                    <span className="font-mono font-bold text-violet-300 text-lg">
                                        Total ₹{shoppingPlans.reduce((s, i) => s + Number(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {shoppingPlans.length === 0 ? (
                            <div className="text-center py-16 dash-glass rounded-3xl">
                                <ShoppingCart className="mx-auto text-gray-600 mb-4" size={48} strokeWidth={1.5} />
                                <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">No items in shopping plan</p>
                            </div>
                        ) : (
                            <div className="dash-glass rounded-2xl overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-400">
                                    <div className="col-span-5">Item</div>
                                    <div className="col-span-3 text-right">Est. Amount</div>
                                    <div className="col-span-4 text-center">Actions</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {[...shoppingPlans]
                                        .filter(i => i.name.toLowerCase().includes(shopSearch.toLowerCase()))
                                        .sort((a, b) => PRIORITY_ORDER[a.priority || 'medium'] - PRIORITY_ORDER[b.priority || 'medium'])
                                        .map((item) => (
                                        <div key={item.id}>
                                            {editingShopId === item.id ? (
                                                <form onSubmit={saveEditShopItem} className="p-4 grid md:grid-cols-12 md:gap-4 md:items-center bg-violet-500/5">
                                                    <div className="col-span-2 mb-2 md:mb-0">
                                                        <input
                                                            type="text"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm"
                                                            value={editShopForm.name}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, name: e.target.value })}
                                                            required autoFocus placeholder="Name"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 mb-2 md:mb-0">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm"
                                                            value={editShopForm.amount}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, amount: e.target.value })}
                                                            required placeholder="₹"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 mb-2 md:mb-0">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm"
                                                            value={editShopForm.quantity}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, quantity: e.target.value })}
                                                            placeholder="Qty"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 mb-2 md:mb-0">
                                                        <select
                                                            className="dash-input w-full px-2 py-2 rounded-lg text-sm appearance-none"
                                                            value={editShopForm.unit}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, unit: e.target.value })}
                                                        >
                                                            {UNITS.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 mb-2 md:mb-0">
                                                        <select
                                                            className="dash-input w-full px-3 py-2 rounded-lg text-sm appearance-none"
                                                            value={editShopForm.priority}
                                                            onChange={(e) => setEditShopForm({ ...editShopForm, priority: e.target.value })}
                                                        >
                                                            <option value="high" className="bg-gray-900">🔴 High</option>
                                                            <option value="medium" className="bg-gray-900">🟡 Medium</option>
                                                            <option value="low" className="bg-gray-900">⚪ Low</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 mb-2 md:mb-0">
                                                        <CloudinaryUpload
                                                            label="Img"
                                                            currentUrl={editShopForm.image_url}
                                                            onUpload={(url) => setEditShopForm(f => ({ ...f, image_url: url }))}
                                                        />
                                                    </div>
                                                    <div className="col-span-3 flex gap-2 justify-center">
                                                        <button type="submit" disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-mono tracking-widest uppercase hover:bg-violet-500/30 transition-all disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={12} /> Save
                                                        </button>
                                                        <button type="button" onClick={() => setEditingShopId(null)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-400 border border-white/10 text-xs font-mono tracking-widest uppercase hover:bg-gray-700 transition-all"
                                                        >
                                                            <X size={12} /> Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.02] transition-colors group">
                                                    <div className="col-span-5 flex items-center gap-3 mb-2 md:mb-0">
                                                        {item.image_url ? (
                                                            <img
                                                                src={item.image_url} alt={item.name}
                                                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-violet-500/30 cursor-pointer hover:border-violet-400 hover:scale-105 transition-all"
                                                                onClick={() => setLightboxImg(item.image_url)}
                                                                onError={(e) => { e.target.style.display='none'; }}
                                                            />
                                                        ) : (
                                                            <ShoppingCart size={16} className="text-violet-400 shrink-0" />
                                                        )}
                                                        <div>
                                                            <span className="text-[#3D52A0] font-medium">{item.name}</span>
                                                            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                                {(() => { const p = priorityConfig[item.priority || 'medium']; return (
                                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase border ${p.bg} ${p.border} ${p.color}`}>
                                                                        {p.icon}{p.label}
                                                                    </span>
                                                                ); })()}
                                                                {item.quantity && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase border bg-violet-500/10 border-violet-500/30 text-violet-300">
                                                                        {item.quantity} {item.unit || 'nos'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-3 text-right font-mono font-bold text-violet-300 mb-2 md:mb-0">
                                                        ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="col-span-4 flex gap-2 justify-center mt-3 md:mt-0">
                                                        <button
                                                            onClick={() => { setEditingShopId(item.id); setEditShopForm({ name: item.name, amount: item.amount, image_url: item.image_url || "", priority: item.priority || "medium", quantity: item.quantity || "", unit: item.unit || "nos" }); }}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono tracking-widest uppercase hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => completeShoppingItem(item)}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono tracking-widest uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Check size={12} /> Done
                                                        </button>
                                                        <button
                                                            onClick={() => deleteShoppingItem(item.id)}
                                                            disabled={shopLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono tracking-widest uppercase hover:bg-rose-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Trash2 size={12} /> Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Items */}
                        {completedPlans.length > 0 && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCompleted(v => !v)}
                                    className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-gray-200 transition-colors mb-3"
                                >
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    {showCompleted ? 'Hide' : 'Show'} Completed ({completedPlans.length})
                                </button>
                                {showCompleted && (
                                    <div className="dash-glass rounded-2xl overflow-hidden opacity-70">
                                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-gray-900/50 text-xs font-mono tracking-widest uppercase text-gray-500">
                                            <div className="col-span-7">Item</div>
                                            <div className="col-span-5 text-right">Amount</div>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {completedPlans.map((item) => (
                                                <div key={item.id} className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                                                    <div className="col-span-7 flex items-center gap-3">
                                                        <CheckCircle2 size={15} className="text-emerald-500/60 shrink-0" />
                                                        <span className="text-gray-400 line-through">{item.name}</span>
                                                    </div>
                                                    <div className="col-span-5 text-right font-mono text-gray-500 line-through">
                                                        ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Image Lightbox */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
                    onClick={() => setLightboxImg(null)}
                >
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setLightboxImg(null)}
                            className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-gray-900 border border-white/20 text-gray-400 hover:text-[#3D52A0] transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <img
                            src={lightboxImg}
                            alt="Product"
                            className="w-full max-h-[80vh] object-contain rounded-2xl border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                        />
                    </div>
                </div>
            )}

            {/* Scan Bill — Review & Confirm */}
            {scanReview && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
                    onClick={discardScanReview}
                >
                    <div
                        className="relative max-w-md w-full dash-glass rounded-3xl p-6 md:p-8 overflow-y-auto"
                        style={{ maxHeight: "90vh" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                <ScanLine className="text-indigo-400" size={20} />
                                Review Scanned Bill
                            </h2>
                            <button onClick={discardScanReview} className="text-gray-500 hover:text-[#3D52A0] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {scanReview.previewUrl && (
                            <img
                                src={scanReview.previewUrl}
                                alt="Scanned bill"
                                className="w-full max-h-48 object-contain rounded-xl border border-indigo-500/20 mb-6 bg-black/20"
                            />
                        )}

                        <p className="text-[10px] font-mono tracking-widest uppercase text-indigo-400/70 mb-4">
                            AI-extracted — please verify before saving
                        </p>

                        <div className="grid gap-4">
                            <div>
                                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Title *</label>
                                <input
                                    type="text"
                                    className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                    value={scanReview.title}
                                    onChange={e => setScanReview(r => ({ ...r, title: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500/50"
                                        value={scanReview.amount}
                                        onChange={e => setScanReview(r => ({ ...r, amount: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Type</label>
                                    <select
                                        className="dash-input w-full px-4 py-3 rounded-xl appearance-none focus:ring-1 focus:ring-emerald-500/50"
                                        value={scanReview.type}
                                        onChange={e => setScanReview(r => ({ ...r, type: e.target.value }))}
                                    >
                                        <option value="expense" className="bg-gray-900">Expense</option>
                                        <option value="income" className="bg-gray-900">Income</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Category</label>
                                    <input
                                        type="text"
                                        list="scan-category-list"
                                        placeholder="e.g. Food"
                                        className="dash-input w-full px-4 py-3 rounded-xl placeholder-gray-600 focus:ring-1 focus:ring-emerald-500/50"
                                        value={scanReview.category}
                                        onChange={e => setScanReview(r => ({ ...r, category: e.target.value }))}
                                    />
                                    <datalist id="scan-category-list">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        className="dash-input w-full px-4 py-3 rounded-xl focus:ring-1 focus:ring-emerald-500/50"
                                        value={scanReview.date}
                                        onChange={e => setScanReview(r => ({ ...r, date: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {scanError && <p className="text-rose-400 text-xs font-mono mt-4">{scanError}</p>}

                        <div className="flex gap-4 mt-6 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={confirmScanReview}
                                disabled={scanSaving || !scanReview.title.trim() || !scanReview.amount}
                                className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-semibold tracking-widest uppercase shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-50 transition-all border border-emerald-500/50"
                            >
                                {scanSaving ? "Saving..." : "Confirm & Add"}
                            </button>
                            <button
                                type="button"
                                onClick={discardScanReview}
                                className="flex-1 px-8 py-3.5 bg-gray-900/50 hover:bg-gray-800 text-gray-400 border border-white/10 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
