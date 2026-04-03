# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, single-page web app using plain HTML, CSS, and Vanilla JavaScript. All state lives in an in-memory `transactions[]` array persisted to `localStorage`. A single `render()` call drives all UI updates after any state change.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with all required element IDs: `#input-form`, `#item-name`, `#item-amount`, `#item-category`, `#new-category`, `#add-category-btn`, `#form-error`, `#transaction-list`, `#total-balance`, `#spending-chart`, `#chart-empty`, `#chart-error`, `#month-filter`, `#sort-select`, `#storage-warning`
  - Link `css/styles.css` and `js/app.js` via `<script defer>` and `<link rel="stylesheet">`
  - Load Chart.js from CDN (`<script src="https://cdn.jsdelivr.net/npm/chart.js">`)
  - Create empty `css/styles.css` and `js/app.js` placeholder files
  - _Requirements: 9.3, 10.1, 10.2, 4.3_

- [x] 2. Implement application state and localStorage persistence
  - [x] 2.1 Define module-scope state variables in `js/app.js`
    - Declare `transactions`, `categories`, `activeFilter`, `activeSort`, `chartInstance` with correct initial values
    - Define `DEFAULT_CATEGORIES`, `STORAGE_KEY_TRANSACTIONS`, `STORAGE_KEY_CATEGORIES` constants
    - _Requirements: 1.2, 6.1_
  - [x] 2.2 Implement `loadFromStorage()` and `saveToStorage()` helpers
    - Wrap all `localStorage` calls in try/catch; on `SecurityError` set a flag and show `#storage-warning`
    - Wrap `JSON.parse` in try/catch; fall back to empty arrays and log a console warning on malformed JSON
    - On load, restore `transactions` and `categories` (merging defaults without duplication)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 2.3 Write property test for localStorage round-trip (Property 8)
    - **Property 8: localStorage round-trip for transactions**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 3. Implement core render pipeline
  - [x] 3.1 Implement `getVisibleTransactions()` — applies `activeFilter` and `activeSort` to `transactions[]` without mutating it
    - Filter by `"YYYY-MM"` prefix match on `transaction.date` when `activeFilter` is set
    - Sort by `amount-asc`, `amount-desc`, `category-asc`, or default (descending date / insertion order)
    - _Requirements: 7.2, 8.2_
  - [x] 3.2 Implement `renderBalance()` — sums amounts from `getVisibleTransactions()` and updates `#total-balance`
    - Display `0` when no transactions exist
    - _Requirements: 3.1, 3.4_
  - [ ]* 3.3 Write property test for balance calculation (Property 6)
    - **Property 6: Balance equals sum of visible transactions**
    - **Validates: Requirements 3.1, 3.4**
  - [x] 3.4 Implement `renderList()` — rebuilds `#transaction-list` from `getVisibleTransactions()`
    - Each `<li>` shows name, amount, category, date and includes a delete button with `data-id` attribute
    - _Requirements: 2.1, 2.5_
  - [ ]* 3.5 Write property test for list rendering (Property 3)
    - **Property 3: Transaction list renders all stored transactions**
    - **Validates: Requirements 2.1**
  - [ ]* 3.6 Write property test for most-recent-first ordering (Property 5)
    - **Property 5: Most-recent-first ordering**
    - **Validates: Requirements 2.5**
  - [x] 3.7 Implement `renderChart()` — builds Chart.js Pie instance from `getVisibleTransactions()`
    - Call `chartInstance.destroy()` before creating a new `Chart` instance to avoid stale data
    - Hide `#spending-chart` and show `#chart-empty` when no visible transactions exist
    - Guard against `window.Chart` being undefined; show `#chart-error` if Chart.js failed to load
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 3.8 Write property test for chart datasets (Property 7)
    - **Property 7: Chart datasets match categories with transactions**
    - **Validates: Requirements 4.1, 4.4**
  - [x] 3.9 Implement top-level `render()` that calls `renderBalance()`, `renderList()`, and `renderChart()` in sequence
    - _Requirements: 3.2, 3.3, 4.2_

- [x] 4. Checkpoint — wire up render on load
  - Call `loadFromStorage()` then `render()` on `DOMContentLoaded`
  - Verify the page loads with persisted data (or empty state) without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement transaction input and validation
  - [x] 5.1 Implement form submit handler on `#input-form`
    - Validate name (non-empty after trim), amount (positive number), category (non-empty); show errors in `#form-error`
    - On success: create a `Transaction` object with `crypto.randomUUID()` id and ISO date, push to `transactions[]`, save, render, clear form fields
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  - [ ]* 5.2 Write property test for valid submission (Property 1)
    - **Property 1: Valid submission adds transaction**
    - **Validates: Requirements 1.3, 1.5**
  - [ ]* 5.3 Write property test for invalid submission rejection (Property 2)
    - **Property 2: Invalid submission is rejected and shows error**
    - **Validates: Requirements 1.3, 1.4**

- [x] 6. Implement transaction deletion
  - [x] 6.1 Attach delegated click handler on `#transaction-list` for delete buttons
    - Read `data-id` from the clicked button, filter it out of `transactions[]`, save, render
    - _Requirements: 2.4_
  - [ ]* 6.2 Write property test for delete (Property 4)
    - **Property 4: Delete removes transaction from list and localStorage**
    - **Validates: Requirements 2.4**

- [x] 7. Implement custom category management
  - [x] 7.1 Implement `renderCategoryOptions()` — rebuilds `<option>` elements in `#item-category` from `categories[]`
    - Call this after load and after any category change
    - _Requirements: 1.2, 6.2, 6.4_
  - [x] 7.2 Implement `#add-category-btn` click handler
    - Read `#new-category` value; reject empty or case-insensitive duplicate (show error in `#form-error`); otherwise push to `categories[]`, save, call `renderCategoryOptions()`, clear input
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - [ ]* 7.3 Write property test for category creation round-trip (Property 9)
    - **Property 9: Category creation round-trip**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [ ]* 7.4 Write property test for duplicate category rejection (Property 10)
    - **Property 10: Duplicate category rejection**
    - **Validates: Requirements 6.5**

- [x] 8. Implement month filter and sort controls
  - [x] 8.1 Attach `change` handler on `#month-filter`
    - Set `activeFilter` to the input value (`"YYYY-MM"`) or `null` when cleared; call `render()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 8.2 Write property test for month filter (Property 11)
    - **Property 11: Month filter shows only matching transactions**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  - [ ]* 8.3 Write property test for filter clear (Property 12)
    - **Property 12: Filter clear restores all transactions**
    - **Validates: Requirements 7.5**
  - [x] 8.4 Attach `change` handler on `#sort-select`
    - Set `activeSort` to the selected value; call `render()`
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 8.5 Write property test for sort (Property 13)
    - **Property 13: Sort reorders display without mutating stored array**
    - **Validates: Requirements 8.2**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement responsive CSS layout
  - Write `css/styles.css` with a responsive layout using media queries covering 320px–1440px
  - Ensure `#input-form`, `#transaction-list`, and `#spending-chart` are fully usable on touch screens without horizontal scrolling
  - _Requirements: 9.1, 9.2_

- [ ] 11. Write unit tests
  - Create `tests/unit.test.js` with a minimal assertion helper (no framework)
  - Test: default categories (Food, Transport, Fun) present on load — **Req 1.2**
  - Test: balance displays `0` when no transactions — **Req 3.4**
  - Test: chart shows empty-state message when no transactions — **Req 4.4**
  - Test: localStorage unavailable warning is shown — **Req 5.4**
  - Test: month selector control exists in DOM — **Req 7.1**
  - Test: sort control exists with correct options — **Req 8.1**
  - Test: `css/styles.css` and `js/app.js` referenced in `index.html` — **Req 9.3**

- [ ] 12. Write property-based tests
  - Create `tests/property.test.js` using fast-check (loaded via CDN or Node runner)
  - Each test runs a minimum of 100 iterations and includes the comment tag `// Feature: expense-budget-visualizer, Property N: <property_text>`
  - Implement all 13 properties from the design document (P1–P13)
  - _Requirements: all_

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness invariants; unit tests cover specific examples and edge cases
- The stored `transactions[]` array must never be mutated by sort or filter operations
