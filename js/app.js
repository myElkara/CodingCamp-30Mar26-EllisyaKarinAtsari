// Expense & Budget Visualizer — app.js

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES       = ["Food", "Transport", "Fun"];
const STORAGE_KEY_TRANSACTIONS = "ebv_transactions";
const STORAGE_KEY_CATEGORIES   = "ebv_categories";

// ─── Module-scope state ───────────────────────────────────────────────────────
let transactions  = [];   // Transaction[]  — canonical list, insertion order
let categories    = [];   // string[]       — all category names (default + custom)
let activeFilter  = null; // string | null  — "YYYY-MM" or null
let activeSort    = "";   // string         — sort key or ""
let chartInstance = null; // Chart | null   — current Chart.js instance

let storageUnavailable = false; // set to true when localStorage is inaccessible

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Persist current transactions and categories to localStorage.
 * If localStorage is unavailable the call is silently skipped (the
 * #storage-warning banner was already shown during loadFromStorage).
 */
function saveToStorage() {
  if (storageUnavailable) return;

  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEY_CATEGORIES,   JSON.stringify(categories));
  } catch (err) {
    if (err.name === "SecurityError") {
      storageUnavailable = true;
      showStorageWarning();
    } else {
      throw err;
    }
  }
}

/**
 * Read transactions and categories from localStorage into module state.
 * - On SecurityError: sets storageUnavailable flag and shows #storage-warning.
 * - On malformed JSON: falls back to empty arrays and logs a console warning.
 * - Merges DEFAULT_CATEGORIES without duplication.
 */
function loadFromStorage() {
  let storedTransactions = [];
  let storedCategories   = [];

  try {
    const rawTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (rawTransactions !== null) {
      try {
        storedTransactions = JSON.parse(rawTransactions);
        if (!Array.isArray(storedTransactions)) {
          console.warn("ebv: stored transactions is not an array — resetting to []");
          storedTransactions = [];
        }
      } catch (parseErr) {
        console.warn("ebv: malformed JSON in ebv_transactions — resetting to []", parseErr);
        storedTransactions = [];
      }
    }

    const rawCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (rawCategories !== null) {
      try {
        storedCategories = JSON.parse(rawCategories);
        if (!Array.isArray(storedCategories)) {
          console.warn("ebv: stored categories is not an array — resetting to []");
          storedCategories = [];
        }
      } catch (parseErr) {
        console.warn("ebv: malformed JSON in ebv_categories — resetting to []", parseErr);
        storedCategories = [];
      }
    }
  } catch (err) {
    if (err.name === "SecurityError") {
      storageUnavailable = true;
      showStorageWarning();
      transactions = [];
      categories   = mergeDefaultCategories([]);
      return;
    }
    throw err;
  }

  transactions = storedTransactions;
  categories   = mergeDefaultCategories(storedCategories);
}

/**
 * Return a new array that contains all DEFAULT_CATEGORIES followed by any
 * entries in `saved` that are not already present (case-insensitive check).
 *
 * @param {string[]} saved
 * @returns {string[]}
 */
function mergeDefaultCategories(saved) {
  const result = [...DEFAULT_CATEGORIES];
  for (const cat of saved) {
    const isDuplicate = result.some(
      existing => existing.toLowerCase() === cat.toLowerCase()
    );
    if (!isDuplicate) {
      result.push(cat);
    }
  }
  return result;
}

/** Show the persistent storage-warning banner. */
function showStorageWarning() {
  const banner = document.getElementById("storage-warning");
  if (banner) {
    banner.removeAttribute("hidden");
  }
}

// ─── View helpers ─────────────────────────────────────────────────────────────

/**
 * Return a filtered + sorted copy of transactions[].
 * Never mutates the stored array.
 *
 * @returns {Transaction[]}
 */
function getVisibleTransactions() {
  let result = transactions.slice(); // shallow copy — stored order preserved

  // Filter by "YYYY-MM" prefix match on transaction.date
  if (activeFilter) {
    result = result.filter(t => t.date.startsWith(activeFilter));
  }

  // Sort
  switch (activeSort) {
    case "amount-asc":
      result.sort((a, b) => a.amount - b.amount);
      break;
    case "amount-desc":
      result.sort((a, b) => b.amount - a.amount);
      break;
    case "category-asc":
      result.sort((a, b) => a.category.localeCompare(b.category));
      break;
    default:
      // Default: most-recent-first (descending date / insertion order)
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
  }

  return result;
}

// ─── Render functions ─────────────────────────────────────────────────────────

/**
 * Update #total-balance with the sum of visible transaction amounts.
 * Displays 0 when no transactions are visible.
 */
function renderBalance() {
  const visible = getVisibleTransactions();
  const total   = visible.reduce((sum, t) => sum + t.amount, 0);
  const el      = document.getElementById("total-balance");
  if (el) el.textContent = total.toFixed(2);
}

/**
 * Rebuild #transaction-list from the current visible transactions.
 * Each <li> shows name, amount, category, date and a delete button.
 */
function renderList() {
  const list    = document.getElementById("transaction-list");
  if (!list) return;

  const visible = getVisibleTransactions();
  list.innerHTML = "";

  for (const t of visible) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="t-name">${escapeHtml(t.name)}</span>
      <span class="t-amount">$${Number(t.amount).toFixed(2)}</span>
      <span class="t-category">${escapeHtml(t.category)}</span>
      <span class="t-date">${formatDate(t.date)}</span>
      <button class="delete-btn" data-id="${t.id}" aria-label="Delete ${escapeHtml(t.name)}">Delete</button>
    `;
    list.appendChild(li);
  }
}

/** Minimal HTML escape to prevent XSS from user-supplied strings. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format an ISO date string to a readable local date. */
function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString();
  } catch {
    return isoString;
  }
}

/**
 * Build (or rebuild) the Chart.js Pie chart from visible transactions.
 * - Destroys any existing chart instance before creating a new one.
 * - Shows #chart-empty when no visible transactions exist.
 * - Shows #chart-error if Chart.js failed to load from CDN.
 */
function renderChart() {
  const canvas     = document.getElementById("spending-chart");
  const emptyMsg   = document.getElementById("chart-empty");
  const errorMsg   = document.getElementById("chart-error");

  // Guard: Chart.js CDN failed to load
  if (typeof window.Chart === "undefined") {
    if (canvas)   canvas.hidden   = true;
    if (emptyMsg) emptyMsg.hidden = true;
    if (errorMsg) errorMsg.hidden = false;
    return;
  }

  const visible = getVisibleTransactions();

  // Empty state
  if (visible.length === 0) {
    if (canvas)   canvas.hidden   = true;
    if (emptyMsg) emptyMsg.hidden = false;
    if (errorMsg) errorMsg.hidden = true;
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  // Aggregate amounts by category
  const totals = {};
  for (const t of visible) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  const labels = Object.keys(totals);
  const data   = labels.map(l => totals[l]);

  // Show canvas, hide empty/error states
  if (canvas)   canvas.hidden   = false;
  if (emptyMsg) emptyMsg.hidden = true;
  if (errorMsg) errorMsg.hidden = true;

  // Destroy stale instance before creating a new one
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new window.Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ─── Category options ─────────────────────────────────────────────────────────

/**
 * Rebuild all <option> elements inside #item-category from the categories[]
 * array. Preserves the currently selected value if it still exists.
 */
function renderCategoryOptions() {
  const select = document.getElementById("item-category");
  if (!select) return;

  const currentValue = select.value;

  // Clear existing options except the placeholder
  select.innerHTML = '<option value="">-- Select category --</option>';

  for (const cat of categories) {
    const option = document.createElement("option");
    option.value       = cat;
    option.textContent = cat;
    select.appendChild(option);
  }

  // Restore previously selected value if it still exists
  if (currentValue && categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

// ─── Top-level render ─────────────────────────────────────────────────────────

/**
 * Re-render the entire UI from current state.
 * Call this after any state mutation (add, delete, filter change, sort change).
 */
function render() {
  renderBalance();
  renderList();
  renderChart();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  renderCategoryOptions();
  render();

  // ─── Form submit handler ───────────────────────────────────────────────────
  const form      = document.getElementById("input-form");
  const formError = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameEl     = document.getElementById("item-name");
    const amountEl   = document.getElementById("item-amount");
    const categoryEl = document.getElementById("item-category");

    const name     = nameEl.value.trim();
    const amount   = parseFloat(amountEl.value);
    const category = categoryEl.value;

    // Validate
    const errors = [];
    if (!name)                          errors.push("Name is required.");
    if (!amountEl.value || isNaN(amount) || amount <= 0)
                                        errors.push("Amount must be a positive number.");
    if (!category)                      errors.push("Category is required.");

    if (errors.length > 0) {
      formError.textContent = errors.join(" ");
      return;
    }

    // Clear any previous error
    formError.textContent = "";

    // Build and store transaction
    const transaction = {
      id:       crypto.randomUUID(),
      name,
      amount,
      category,
      date:     new Date().toISOString()
    };

    transactions.push(transaction);
    saveToStorage();
    render();

    // Clear form fields
    nameEl.value     = "";
    amountEl.value   = "";
    categoryEl.value = "";
  });

  // ─── Delete handler (event delegation) ────────────────────────────────────
  const transactionList = document.getElementById("transaction-list");

  transactionList.addEventListener("click", (e) => {
    if (!e.target.classList.contains("delete-btn")) return;
    const id = e.target.dataset.id;
    transactions = transactions.filter(t => t.id !== id);
    saveToStorage();
    render();
  });

  // ─── Month filter handler ──────────────────────────────────────────────────
  const monthFilter = document.getElementById("month-filter");

  monthFilter.addEventListener("change", () => {
    activeFilter = monthFilter.value || null;
    render();
  });

  // ─── Sort handler ──────────────────────────────────────────────────────────
  const sortSelect = document.getElementById("sort-select");

  sortSelect.addEventListener("change", () => {
    activeSort = sortSelect.value;
    render();
  });

  // ─── Add category handler ──────────────────────────────────────────────────
  const addCategoryBtn  = document.getElementById("add-category-btn");
  const newCategoryInput = document.getElementById("new-category");

  addCategoryBtn.addEventListener("click", () => {
    const name = newCategoryInput.value.trim();

    if (!name) {
      formError.textContent = "Category name cannot be empty.";
      return;
    }

    const isDuplicate = categories.some(
      cat => cat.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      formError.textContent = `Category "${name}" already exists.`;
      return;
    }

    categories.push(name);
    saveToStorage();
    renderCategoryOptions();
    newCategoryInput.value = "";
    formError.textContent  = "";
  });
});
