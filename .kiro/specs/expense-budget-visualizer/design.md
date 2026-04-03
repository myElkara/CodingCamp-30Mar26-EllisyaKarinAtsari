# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a zero-dependency, single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no build step or server — just open `index.html`. All state is persisted to `localStorage`. The UI is split into three primary concerns: data entry (Input Form), data display (Transaction List + Balance), and data visualization (Chart.js pie chart). A month filter and sort control layer on top of the display without mutating stored data.

### Key Design Decisions

- **No framework**: keeps the bundle to zero bytes of JS framework overhead and makes the app instantly runnable.
- **Single source of truth**: an in-memory array `transactions[]` is the canonical state; every render reads from it.
- **Immutable stored order**: sorting and filtering are view-only transforms — the stored array is never reordered.
- **Chart.js via CDN**: avoids local installation while providing a mature, well-documented charting library.

---

## Architecture

The app follows a simple unidirectional data flow:

```
User Action
    │
    ▼
State Mutation (add / delete / load)
    │
    ▼
Persist to localStorage
    │
    ▼
render() ──► renderList()   (applies active filter + sort)
         ├──► renderBalance() (applies active filter)
         └──► renderChart()   (applies active filter)
```

All UI updates are triggered by a single `render()` call after any state change. There is no two-way binding — the DOM is always rebuilt from state.

### File Structure

```
index.html          ← single entry point, loads CDN scripts + local files
css/
  styles.css        ← all styling, responsive via media queries
js/
  app.js            ← all application logic
```

---

## Components and Interfaces

### 1. Input Form (`#input-form`)

Responsible for collecting and validating new transaction data.

| Element | ID / selector | Purpose |
|---|---|---|
| Text input | `#item-name` | Transaction name |
| Number input | `#item-amount` | Transaction amount |
| Select | `#item-category` | Category picker (default + custom) |
| Text input | `#new-category` | New custom category name |
| Button | `#add-category-btn` | Adds custom category |
| Button | `[type=submit]` | Submits transaction |
| Error area | `#form-error` | Inline validation messages |

**Validation rules** (enforced on submit):
- `item-name`: non-empty after trim
- `item-amount`: non-empty, parseable as a positive number
- `item-category`: non-empty (a category must be selected)

### 2. Transaction List (`#transaction-list`)

Renders the current view of transactions (filtered + sorted).

| Element | Purpose |
|---|---|
| `<ul id="transaction-list">` | Container |
| `<li>` per transaction | Shows name, amount, category, date |
| Delete button per `<li>` | Triggers deletion by transaction ID |

### 3. Balance Display (`#total-balance`)

A single `<span>` updated on every render to show the sum of currently visible transactions.

### 4. Pie Chart (`#spending-chart`)

A `<canvas>` element managed by a Chart.js `Pie` instance. Rebuilt on every render call using `chart.destroy()` + `new Chart(...)` to avoid stale dataset issues.

Empty state: when no transactions are in the current view, the canvas is hidden and a `#chart-empty` message is shown.

### 5. Month Filter (`#month-filter`)

An `<input type="month">` that sets the active `activeFilter` state variable (`"YYYY-MM"` string or `null`). Clearing the input resets to `null` (show all).

### 6. Sort Control (`#sort-select`)

A `<select>` with options:
- `""` — default (insertion order, most recent first)
- `"amount-asc"` — amount ascending
- `"amount-desc"` — amount descending
- `"category-asc"` — category alphabetical

Sets `activeSort` state variable. Never mutates `transactions[]`.

---

## Data Models

### Transaction

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  name: string,        // trimmed, non-empty
  amount: number,      // positive float
  category: string,    // must exist in categories[]
  date: string         // ISO 8601 date string, e.g. "2024-07-15T10:30:00.000Z"
}
```

### Application State (in-memory, `js/app.js` module scope)

```js
let transactions = [];   // Transaction[]  — canonical list, insertion order
let categories   = [];   // string[]       — all category names (default + custom)
let activeFilter = null; // string | null  — "YYYY-MM" or null
let activeSort   = "";   // string         — sort key or ""
let chartInstance = null;// Chart | null   — current Chart.js instance
```

### localStorage Keys

| Key | Value |
|---|---|
| `"ebv_transactions"` | `JSON.stringify(Transaction[])` |
| `"ebv_categories"` | `JSON.stringify(string[])` |

### Default Categories

```js
const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];
```

On first load (no saved categories), `categories` is initialised from `DEFAULT_CATEGORIES`. Custom categories are appended and persisted separately so defaults are never duplicated.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid submission adds transaction

*For any* valid transaction input (non-empty name, positive amount, existing category), submitting the form should result in the transaction list growing by exactly one entry containing the submitted values, and the form fields should be cleared.

**Validates: Requirements 1.3, 1.5**

---

### Property 2: Invalid submission is rejected and shows error

*For any* form submission where at least one required field (name, amount, category) is empty or invalid, the transaction list should remain unchanged and the error display element should be non-empty.

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Transaction list renders all stored transactions

*For any* set of stored transactions, every transaction in the array should appear in the rendered list with its name, amount, and category visible.

**Validates: Requirements 2.1**

---

### Property 4: Delete removes transaction from list and localStorage

*For any* stored transaction, after the delete action is triggered for that transaction, it should no longer appear in the rendered list and should not be present in the `ebv_transactions` localStorage entry.

**Validates: Requirements 2.4**

---

### Property 5: Most-recent-first ordering

*For any* list of transactions with distinct dates, when no sort option is active, the rendered list should display transactions in descending date order (most recent first).

**Validates: Requirements 2.5**

---

### Property 6: Balance equals sum of visible transactions

*For any* set of transactions (including the empty set), the displayed balance should equal the arithmetic sum of the amounts of all currently visible transactions. When no transactions exist, the balance should be 0.

**Validates: Requirements 3.1, 3.4**

---

### Property 7: Chart datasets match categories with transactions

*For any* set of transactions, the chart's dataset labels should contain exactly the set of categories that have at least one transaction in the current view, with each value equal to the sum of amounts for that category. When no transactions exist, the chart canvas should be hidden and the empty-state message should be visible.

**Validates: Requirements 4.1, 4.4**

---

### Property 8: localStorage round-trip for transactions

*For any* sequence of add and delete operations, serializing `transactions[]` to localStorage and then deserializing it should produce an array equal to the in-memory state, and reloading the app from that localStorage state should render the same list, balance, and chart.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 9: Category creation round-trip

*For any* valid new category name, after creation the name should appear in the category selector options, be present in the `ebv_categories` localStorage entry, and be restored into the selector after a simulated reload from localStorage.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 10: Duplicate category rejection

*For any* existing category name (in any casing), attempting to add it again should leave the category list unchanged and display an error message.

**Validates: Requirements 6.5**

---

### Property 11: Month filter shows only matching transactions

*For any* set of transactions and any selected month value (`"YYYY-MM"`), all transactions rendered in the list, all chart dataset values, and the displayed balance should correspond only to transactions whose date falls within that calendar month.

**Validates: Requirements 7.2, 7.3, 7.4**

---

### Property 12: Filter clear restores all transactions

*For any* set of transactions, applying a month filter and then clearing it should result in the same rendered list, balance, and chart as if no filter had ever been applied.

**Validates: Requirements 7.5**

---

### Property 13: Sort reorders display without mutating stored array

*For any* list of transactions and any sort option (amount-asc, amount-desc, category-asc), the rendered list should be ordered according to the selected sort criteria, while the underlying `transactions[]` array should remain in its original insertion order.

**Validates: Requirements 8.2**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Form submitted with empty name | Show inline error in `#form-error`; do not add transaction |
| Form submitted with empty/invalid amount | Show inline error; do not add transaction |
| Form submitted with no category selected | Show inline error; do not add transaction |
| Duplicate custom category (case-insensitive) | Show inline error in `#form-error`; do not add category |
| `localStorage` unavailable (SecurityError / private mode) | Wrap all `localStorage` calls in try/catch; show persistent `#storage-warning` banner; app continues in-memory only |
| Chart.js CDN fails to load | Catch `window.Chart` undefined on render; show `#chart-error` message instead of canvas |
| Malformed JSON in localStorage | Wrap `JSON.parse` in try/catch; fall back to empty arrays and log a console warning |

All error messages are displayed inline near the relevant control and cleared on the next successful action.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, integration points, and edge cases.
- **Property tests** verify universal invariants across randomly generated inputs.

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, no build required when loaded via CDN or Node test runner).

Each property test must run a **minimum of 100 iterations**.

Every property test must include a comment tag in the format:

```
// Feature: expense-budget-visualizer, Property N: <property_text>
```

| Property | Test description |
|---|---|
| P1 | Generate random valid transaction inputs; submit; assert list length +1 and form cleared |
| P2 | Generate random inputs with at least one empty field; submit; assert list unchanged and error shown |
| P3 | Generate random transaction arrays; load into state; assert every transaction appears in rendered list |
| P4 | Generate random transaction arrays; pick random transaction; delete; assert absent from list and localStorage |
| P5 | Generate random transaction arrays with distinct dates; render with no sort; assert descending date order |
| P6 | Generate random transaction arrays; assert displayed balance equals `amounts.reduce((s,a) => s+a, 0)` |
| P7 | Generate random transaction arrays; assert chart labels === unique categories with transactions; assert empty state when array is empty |
| P8 | Generate random add/delete sequences; serialize to localStorage; deserialize; assert deep equality with in-memory state |
| P9 | Generate random valid category names; create; assert in selector, in localStorage, and restored after reload |
| P10 | Generate random existing category names with random casing; attempt add; assert list unchanged and error shown |
| P11 | Generate random transactions across multiple months; select random month; assert all rendered items match that month |
| P12 | Generate random transactions; apply random filter; clear filter; assert rendered state equals unfiltered state |
| P13 | Generate random transaction arrays; apply each sort option; assert rendered order matches sort; assert stored array unchanged |

### Unit Tests

Unit tests use a simple assertion helper (no framework needed) and cover:

- Default categories (Food, Transport, Fun) present on load — **Req 1.2**
- Balance displays `0` when no transactions — **Req 3.4**
- Chart shows empty-state message when no transactions — **Req 4.4**
- localStorage unavailable warning is shown — **Req 5.4**
- Month selector control exists in DOM — **Req 7.1**
- Sort control exists with correct options — **Req 8.1**
- `css/styles.css` and `js/app.js` referenced in `index.html` — **Req 9.3**

### Test File Location

```
tests/
  unit.test.js       ← unit tests (run with Node or browser)
  property.test.js   ← fast-check property tests
```
