import { supabase } from '../supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Colours ──────────────────────────────────────────────────────────────
const C = {
  bg:       [6,   9,  19],
  bg2:      [15,  23, 42],
  bg3:      [22,  33, 62],
  bg4:      [30,  41, 59],
  border:   [51,  65, 85],
  text:     [203, 213, 225],
  muted:    [100, 116, 139],
  cyan:     [34,  211, 238],
  green:    [74,  222, 128],
  red:      [248, 113, 113],
  amber:    [251, 191, 36],
  violet:   [167, 139, 250],
  white:    [241, 245, 249],
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function newPage(doc) {
  doc.addPage();
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 297, 'F');
}

function checkY(doc, y, needed = 30) {
  if (y + needed > 275) { newPage(doc); return 16; }
  return y;
}

// strip emojis and decode HTML entities so jsPDF renders cleanly
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    // remove emoji / non-latin characters jsPDF can't render
    .replace(/[^\x00-\x7F\u00C0-\u024F]/g, '')
    .trim();
}

function sectionHeader(doc, label, y, color = C.cyan) {
  // strip emoji prefix before rendering
  const clean = cleanText(label);
  doc.setFillColor(...color.map(v => Math.round(v * 0.25)));
  doc.roundedRect(14, y - 5, 182, 9, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(...color);
  doc.setFont(undefined, 'bold');
  doc.text(clean.toUpperCase(), 18, y + 1);
  doc.setFont(undefined, 'normal');
  return y + 10;
}

function table(doc, head, body, startY, opts = {}) {
  if (!body?.length) return startY;
  // sanitise every cell
  const cleanBody = body.map(row => row.map(cell => cleanText(String(cell ?? ''))));
  const cleanHead = head.map(h => cleanText(String(h ?? '')));
  autoTable(doc, {
    startY,
    head: [cleanHead],
    body: cleanBody,
    theme: 'grid',
    headStyles:          { fillColor: C.bg2, textColor: C.cyan,   fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5 },
    bodyStyles:          { fillColor: C.bg3, textColor: C.text,   fontSize: 7,   cellPadding: 2 },
    alternateRowStyles:  { fillColor: C.bg4 },
    margin:              { left: 14, right: 14 },
    tableLineColor:      C.border,
    tableLineWidth:      0.15,
    ...opts,
  });
  return doc.lastAutoTable.finalY + 8;
}

function kpiRow(doc, items, y) {
  const w = 182 / items.length;
  items.forEach(({ label, value, color = C.cyan }, i) => {
    const x = 14 + i * w;
    doc.setFillColor(...C.bg2);
    doc.roundedRect(x, y, w - 3, 18, 2, 2, 'F');
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, y, w - 3, 18, 2, 2, 'S');
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.setFont(undefined, 'bold');
    doc.text(cleanText(String(value)), x + (w - 3) / 2, y + 10, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.setFont(undefined, 'normal');
    doc.text(cleanText(label).toUpperCase(), x + (w - 3) / 2, y + 15.5, { align: 'center' });
  });
  return y + 24;
}

function coverPage(doc, title, subtitle, date) {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 297, 'F');
  // accent bar top
  doc.setFillColor(...C.cyan);
  doc.rect(0, 0, 210, 2, 'F');
  // accent bar bottom
  doc.rect(0, 295, 210, 2, 'F');

  doc.setFontSize(28);
  doc.setTextColor(...C.white);
  doc.setFont(undefined, 'bold');
  doc.text(cleanText(title), 105, 120, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...C.cyan);
  doc.setFont(undefined, 'normal');
  doc.text(cleanText(subtitle), 105, 134, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(`Generated on ${cleanText(date)}`, 105, 148, { align: 'center' });

  // divider
  doc.setDrawColor(...C.border);
  doc.line(40, 155, 170, 155);
}

function footer(doc, date) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(`Shahid KM · Self-Development App · ${date}`, 14, 292);
    doc.text(`${i} / ${pages}`, 196, 292, { align: 'right' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1.  SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════════════════
export async function exportSummaryPDF() {
  const today     = new Date().toISOString().split('T')[0];
  const ago30     = new Date(); ago30.setDate(ago30.getDate() - 30);
  const ago30str  = ago30.toISOString().split('T')[0];
  const ago7      = new Date(); ago7.setDate(ago7.getDate() - 7);
  const ago7str   = ago7.toISOString().split('T')[0];

  const [
    { data: allTodos },
    { data: habits },
    { data: habitLogs },
    { data: mood },
    { data: journal },
    { data: skills },
    { data: skillRatings },
    { data: books },
    { data: plans },
    { data: achievements },
    { data: fears },
    { data: comfortZone },
  ] = await Promise.all([
    supabase.from('ToDo').select('title,completed,priority,created_at').eq('active', true).order('created_at', { ascending: false }),
    supabase.from('habits').select('id,name').eq('active', true),
    supabase.from('habit_logs').select('habit_id,date,done').gte('date', ago30str),
    supabase.from('mood_tracker').select('date,mood,note,productivity').order('date', { ascending: false }).limit(30),
    supabase.from('journal_entries').select('date,title,word_count,tags').order('date', { ascending: false }).limit(30),
    supabase.from('skills').select('id,name,goal_rating').eq('active', true),
    supabase.from('skill_ratings').select('skill_id,rating,rated_at').order('rated_at', { ascending: false }),
    supabase.from('books_tracker').select('title,status,current_page,total_pages').order('created_at', { ascending: false }),
    supabase.from('plans').select('title,category,priority,status,start_date,end_date').order('created_at', { ascending: false }),
    supabase.from('achievements').select('title,target_value,start_date,target_date').order('created_at', { ascending: false }),
    supabase.from('fear_crusher').select('fear,conquered').order('created_at', { ascending: false }),
    supabase.from('comfort_zone').select('action,difficulty,done_at').order('created_at', { ascending: false }).limit(20),
  ]);

  const dateLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Cover ──────────────────────────────────────────────────────────────
  coverPage(doc, 'SELF-DEVELOPMENT', 'Summary Report · All Modules', dateLabel);

  // ── Page 2 ─────────────────────────────────────────────────────────────
  newPage(doc);
  let y = 16;

  // ── TODOS ──────────────────────────────────────────────────────────────
  const todayTodos  = (allTodos || []).filter(t => t.created_at?.startsWith(today));
  const last7Todos  = (allTodos || []).filter(t => t.created_at?.split('T')[0] >= ago7str);
  const todayDone   = todayTodos.filter(t => t.completed).length;
  const last7Done   = last7Todos.filter(t => t.completed).length;
  const allDone     = (allTodos || []).filter(t => t.completed).length;

  y = sectionHeader(doc, 'Todos', y, C.cyan);
  y = kpiRow(doc, [
    { label: "Today's Tasks",    value: todayTodos.length,                                                                  color: C.cyan   },
    { label: "Today Done",       value: todayDone,                                                                          color: C.green  },
    { label: "Today %",          value: todayTodos.length ? `${Math.round(todayDone / todayTodos.length * 100)}%` : '—',   color: C.amber  },
    { label: "Last 7d Done",     value: `${last7Done}/${last7Todos.length}`,                                                color: C.violet },
    { label: "All-Time Done",    value: `${allDone}/${(allTodos || []).length}`,                                            color: C.muted  },
  ], y);

  // priority breakdown
  const byPriority = { high: 0, medium: 0, low: 0 };
  (allTodos || []).filter(t => t.completed).forEach(t => { if (t.priority) byPriority[t.priority] = (byPriority[t.priority] || 0) + 1; });
  y = table(doc,
    ['Priority', 'Completed Tasks'],
    Object.entries(byPriority).map(([p, n]) => [p.charAt(0).toUpperCase() + p.slice(1), n]),
    y, { columnStyles: { 0: { cellWidth: 60 } } }
  );

  // ── HABITS ─────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Habit Streaks  (Last 30 Days)', y, C.amber);

  const habitRows = (habits || []).map(h => {
    const logs     = (habitLogs || []).filter(l => l.habit_id === h.id);
    const done     = logs.filter(l => l.done).length;
    const rate     = logs.length ? Math.round(done / logs.length * 100) : 0;
    // current streak
    let streak = 0;
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    let cur = new Date();
    for (const log of sorted) {
      const diff = Math.round((cur - new Date(log.date)) / 86400000);
      if (diff <= 1 && log.done) { streak++; cur = new Date(log.date); } else break;
    }
    return [h.name, `${done} / ${logs.length}`, `${rate}%`, `${streak}d`];
  });

  y = table(doc, ['Habit', 'Done / Total', 'Rate', 'Current Streak'], habitRows, y);

  // ── MOOD ───────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Mood Tracker  (Last 30 Days)', y, C.amber);

  const moodData   = mood || [];
  const avgMood    = moodData.length ? (moodData.reduce((s, m) => s + m.mood, 0) / moodData.length).toFixed(1) : '—';
  const avgProd    = moodData.filter(m => m.productivity).length
    ? (moodData.filter(m => m.productivity).reduce((s, m) => s + m.productivity, 0) / moodData.filter(m => m.productivity).length).toFixed(1)
    : '—';
  const moodDist   = [1, 2, 3, 4, 5].map(v => [['Terrible','Bad','Okay','Good','Amazing'][v - 1], moodData.filter(m => m.mood === v).length]);

  y = kpiRow(doc, [
    { label: 'Days Logged',   value: moodData.length, color: C.cyan   },
    { label: 'Avg Mood /5',   value: avgMood,          color: C.amber  },
    { label: 'Avg Prod /5',   value: avgProd,          color: C.violet },
  ], y);
  y = table(doc, ['Mood Level', 'Days'], moodDist, y, { columnStyles: { 0: { cellWidth: 80 } } });

  // ── JOURNAL ────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Daily Journal', y, C.violet);

  const journalData  = journal || [];
  const totalWords   = journalData.reduce((s, j) => s + (j.word_count || 0), 0);
  const thisMonth    = journalData.filter(j => j.date?.startsWith(new Date().toISOString().slice(0, 7))).length;

  y = kpiRow(doc, [
    { label: 'Total Entries',  value: journalData.length, color: C.violet },
    { label: 'Total Words',    value: totalWords,          color: C.cyan   },
    { label: 'This Month',     value: thisMonth,           color: C.green  },
  ], y);
  y = table(doc,
    ['Date', 'Title', 'Words', 'Tags'],
    journalData.slice(0, 15).map(j => [j.date, j.title || 'Untitled', j.word_count || 0, (j.tags || []).join(', ') || '—']),
    y
  );

  // ── SKILLS ─────────────────────────────────────────────────────────────
  newPage(doc); y = 16;
  y = sectionHeader(doc, 'Skills Tracker', y, C.cyan);

  const latestRating = {};
  (skillRatings || []).forEach(r => { if (!latestRating[r.skill_id]) latestRating[r.skill_id] = r; });

  y = table(doc,
    ['Skill', 'Latest /10', 'Goal /10', 'Last Rated', 'Status'],
    (skills || []).map(s => {
      const r   = latestRating[s.id];
      const val = r?.rating || 0;
      const goal = s.goal_rating || 10;
      const status = val >= goal ? '✓ Reached' : val >= goal * 0.7 ? 'On Track' : 'Needs Work';
      return [s.name, val, goal, r?.rated_at?.split('T')[0] || '—', status];
    }),
    y
  );

  // ── BOOKS ──────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Books & Courses', y, C.green);

  const bookData   = books || [];
  const reading    = bookData.filter(b => b.status === 'reading' || b.status === 'learning').length;
  const completed  = bookData.filter(b => b.status === 'completed').length;

  y = kpiRow(doc, [
    { label: 'Total',      value: bookData.length, color: C.cyan  },
    { label: 'Reading',    value: reading,          color: C.amber },
    { label: 'Completed',  value: completed,        color: C.green },
  ], y);
  y = table(doc,
    ['Title', 'Status', 'Progress'],
    bookData.map(b => [b.title, b.status, b.total_pages ? `${b.current_page || 0} / ${b.total_pages} pages` : '—']),
    y
  );

  // ── PLANS ──────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Plans', y, C.violet);

  const planData   = plans || [];
  const active     = planData.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
  const done_plans = planData.filter(p => p.status === 'completed').length;

  y = kpiRow(doc, [
    { label: 'Total',    value: planData.length, color: C.cyan   },
    { label: 'Active',   value: active,           color: C.amber  },
    { label: 'Done',     value: done_plans,       color: C.green  },
  ], y);
  y = table(doc,
    ['Title', 'Category', 'Priority', 'Status', 'Deadline'],
    planData.map(p => [
      p.title,
      p.category || '—',
      p.priority === 1 ? 'High' : p.priority === 2 ? 'Medium' : 'Low',
      p.status,
      p.end_date || '—',
    ]),
    y
  );

  // ── ACHIEVEMENTS ───────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Achievements', y, C.amber);
  y = table(doc,
    ['Title', 'Target', 'Start', 'Deadline'],
    (achievements || []).map(a => [a.title, a.target_value || '—', a.start_date || '—', a.target_date || '—']),
    y
  );

  // ── FEARS ──────────────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Fear Crusher', y, C.red);

  const fearData    = fears || [];
  const conquered   = fearData.filter(f => f.conquered).length;

  y = kpiRow(doc, [
    { label: 'Total Fears',  value: fearData.length, color: C.red   },
    { label: 'Conquered',    value: conquered,        color: C.green },
    { label: 'Remaining',    value: fearData.length - conquered, color: C.amber },
  ], y);
  y = table(doc,
    ['Fear', 'Conquered'],
    fearData.map(f => [f.fear, f.conquered ? '✓ Yes' : '✗ No']),
    y
  );

  // ── COMFORT ZONE ───────────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Comfort Zone Pushes', y, C.cyan);
  y = table(doc,
    ['Action', 'Difficulty /5', 'Date'],
    (comfortZone || []).map(c => [c.action, c.difficulty, c.done_at?.split('T')[0] || '—']),
    y
  );

  footer(doc, dateLabel);
  doc.save(`summary-report-${today}.pdf`);
}


// ═══════════════════════════════════════════════════════════════════════════
// 2.  FINANCE REPORT  (Ledger + P&L)
// ═══════════════════════════════════════════════════════════════════════════
export async function exportFinancePDF() {
  const { data: txns } = await supabase
    .from('money_transactions')
    .select('id,title,amount,type,category,date')
    .order('date', { ascending: true });

  const { data: shopping } = await supabase
    .from('shopping_plans')
    .select('name,amount,completed')
    .order('created_at', { ascending: false });

  const dateLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const today     = new Date().toISOString().split('T')[0];
  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Cover ──────────────────────────────────────────────────────────────
  coverPage(doc, 'FINANCE REPORT', 'Ledger · Profit & Loss · Category Breakdown', dateLabel);

  // ── Compute aggregates ─────────────────────────────────────────────────
  const all       = txns || [];
  const income    = all.filter(t => t.type === 'income');
  const expenses  = all.filter(t => t.type === 'expense');
  const totalInc  = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalExp  = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const netBal    = totalInc - totalExp;

  // category maps
  const incByCat  = {};
  income.forEach(t => { const c = t.category || 'General'; incByCat[c] = (incByCat[c] || 0) + Number(t.amount); });
  const expByCat  = {};
  expenses.forEach(t => { const c = t.category || 'General'; expByCat[c] = (expByCat[c] || 0) + Number(t.amount); });

  // month-by-month
  const monthMap  = {};
  all.forEach(t => {
    const m = t.date?.slice(0, 7); // YYYY-MM
    if (!m) return;
    if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 };
    if (t.type === 'income')  monthMap[m].income  += Number(t.amount);
    if (t.type === 'expense') monthMap[m].expense += Number(t.amount);
  });
  const months = Object.keys(monthMap).sort();

  // ── Page 2 — P&L Summary ───────────────────────────────────────────────
  newPage(doc);
  let y = 16;

  y = sectionHeader(doc, 'Profit & Loss Summary', y, C.green);
  y = kpiRow(doc, [
    { label: 'Total Income',   value: totalInc.toLocaleString(), color: C.green },
    { label: 'Total Expenses', value: totalExp.toLocaleString(), color: C.red   },
    { label: 'Net Balance',    value: netBal.toLocaleString(),   color: netBal >= 0 ? C.green : C.red },
    { label: 'Transactions',   value: all.length,                color: C.cyan  },
  ], y);

  // Month-by-month P&L table
  y = sectionHeader(doc, 'Month-by-Month Breakdown', y, C.cyan);
  y = table(doc,
    ['Month', 'Income', 'Expenses', 'Net', 'Status'],
    months.map(m => {
      const { income: inc, expense: exp } = monthMap[m];
      const net = inc - exp;
      const label = new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return [label, inc.toLocaleString(), exp.toLocaleString(), net.toLocaleString(), net >= 0 ? 'Profit' : 'Loss'];
    }),
    y,
    { columnStyles: { 0: { cellWidth: 40 }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { cellWidth: 22, halign: 'center' } } }
  );

  // ── Income by Category ─────────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Income by Category', y, C.green);
  const incCatRows = Object.entries(incByCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, amt.toLocaleString(), `${totalInc ? Math.round(amt / totalInc * 100) : 0}%`]);
  y = table(doc, ['Category', 'Amount', '% of Income'], incCatRows, y,
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', cellWidth: 28 } } }
  );

  // ── Expenses by Category ───────────────────────────────────────────────
  y = checkY(doc, y, 40);
  y = sectionHeader(doc, 'Expenses by Category', y, C.red);
  const expCatRows = Object.entries(expByCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, amt.toLocaleString(), `${totalExp ? Math.round(amt / totalExp * 100) : 0}%`]);
  y = table(doc, ['Category', 'Amount', '% of Expenses'], expCatRows, y,
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', cellWidth: 28 } } }
  );

  // ── Shopping Plan ──────────────────────────────────────────────────────
  if (shopping?.length) {
    y = checkY(doc, y, 40);
    y = sectionHeader(doc, 'Shopping Plan', y, C.violet);
    const pending   = (shopping || []).filter(s => !s.completed);
    const done_shop = (shopping || []).filter(s => s.completed);
    const pendingAmt = pending.reduce((s, i) => s + Number(i.amount), 0);

    y = kpiRow(doc, [
      { label: 'Pending Items',  value: pending.length,                    color: C.amber },
      { label: 'Pending Amount', value: pendingAmt.toLocaleString(),       color: C.red   },
      { label: 'Purchased',      value: done_shop.length,                  color: C.green },
    ], y);

    if (pending.length) {
      y = table(doc,
        ['Item', 'Est. Amount', 'Status'],
        pending.map(s => [s.name, Number(s.amount).toLocaleString(), 'Pending']),
        y,
        { columnStyles: { 1: { halign: 'right', cellWidth: 35 }, 2: { halign: 'center', cellWidth: 25 } } }
      );
    }
  }

  // ── Full Ledger ────────────────────────────────────────────────────────
  newPage(doc); y = 16;
  y = sectionHeader(doc, 'Full Transaction Ledger', y, C.cyan);

  // running balance column
  let running = 0;
  const ledgerRows = all.map(t => {
    const amt = Number(t.amount);
    running += t.type === 'income' ? amt : -amt;
    return [
      cleanText(t.date),
      cleanText(t.title),
      cleanText(t.category || 'General'),
      t.type === 'income'  ? `+Rs.${amt.toLocaleString()}` : '',
      t.type === 'expense' ? `-Rs.${amt.toLocaleString()}` : '',
      `Rs.${running.toLocaleString()}`,
    ];
  });

  // usable width = 210 - 14 (left) - 14 (right) = 182mm
  // col widths:  20 + 56 + 30 + 25 + 25 + 26 = 182
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Category', 'Income', 'Expense', 'Balance']],
    body: ledgerRows,
    theme: 'grid',
    tableWidth: 182,
    headStyles:         { fillColor: C.bg2, textColor: C.cyan, fontSize: 7, fontStyle: 'bold', cellPadding: 2, halign: 'center' },
    bodyStyles:         { fillColor: C.bg3, textColor: C.text, fontSize: 6.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: C.bg4 },
    margin:             { left: 14, right: 14 },
    tableLineColor:     C.border,
    tableLineWidth:     0.15,
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 56, halign: 'left'   },
      2: { cellWidth: 30, halign: 'left'   },
      3: { cellWidth: 25, halign: 'right', textColor: C.green },
      4: { cellWidth: 25, halign: 'right', textColor: C.red   },
      5: { cellWidth: 26, halign: 'right' },
    },
    didParseCell(data) {
      if (data.column.index === 5 && data.section === 'body') {
        const val = data.cell.raw;
        if (typeof val === 'string' && val.startsWith('Rs.-')) {
          data.cell.styles.textColor = C.red;
        } else if (data.section === 'body') {
          data.cell.styles.textColor = C.green;
        }
      }
    },
  });

  footer(doc, dateLabel);
  doc.save(`finance-report-${today}.pdf`);
}
