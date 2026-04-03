# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, single-page web application that helps users track daily spending. It provides a real-time view of total balance, a scrollable transaction history, and a pie chart of spending by category. All data is stored client-side using the browser's Local Storage API. The app requires no backend, no build tools, and no frameworks — just HTML, CSS, and Vanilla JavaScript.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application
- **Transaction**: A single spending entry consisting of a name, amount, and category
- **Category**: A label grouping transactions (e.g., Food, Transport, Fun, or a user-defined custom category)
- **Balance**: The sum of all transaction amounts currently stored
- **Transaction_List**: The scrollable UI component displaying all stored transactions
- **Input_Form**: The UI form used to submit new transactions
- **Chart**: The pie chart visualizing spending distribution by category
- **Local_Storage**: The browser's Local Storage API used for client-side data persistence
- **Monthly_Summary**: An aggregated view of transactions filtered by calendar month

---

## Requirements

### Requirement 1: Transaction Input

**User Story:** As a user, I want to enter a transaction with a name, amount, and category, so that I can record my spending.

#### Acceptance Criteria

1. THE Input_Form SHALL include a text field for item name, a numeric field for amount, and a category selector.
2. THE Input_Form SHALL include the default categories: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form, THE App SHALL validate that the item name, amount, and category fields are all non-empty before adding the transaction.
4. IF any required field is empty on submission, THEN THE Input_Form SHALL display an inline validation error indicating which field is missing.
5. WHEN the Input_Form is successfully submitted, THE App SHALL add the transaction to the Transaction_List and clear the form fields.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my transactions in a scrollable list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
3. WHEN a transaction is added, THE Transaction_List SHALL update immediately to include the new entry.
4. WHEN the user activates the delete control on a transaction, THE App SHALL remove that transaction from the Transaction_List and from Local_Storage.
5. THE Transaction_List SHALL display transactions in the order they were added, most recent first.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total balance at the top of the page, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE App SHALL display the total balance as the sum of all transaction amounts at the top of the page.
2. WHEN a transaction is added, THE App SHALL recalculate and update the displayed balance immediately.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the displayed balance immediately.
4. WHEN no transactions exist, THE App SHALL display a balance of 0.

---

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart showing the proportion of total spending for each category that has at least one transaction.
2. WHEN a transaction is added or deleted, THE Chart SHALL update automatically to reflect the current category totals.
3. THE Chart SHALL render using Chart.js loaded from a CDN, requiring no local installation.
4. WHEN no transactions exist, THE Chart SHALL display an empty state message instead of an empty chart.

---

### Requirement 5: Local Storage Persistence

**User Story:** As a user, I want my transactions to persist between sessions, so that I do not lose my data when I close the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL save the updated transaction list to Local_Storage.
2. WHEN a transaction is deleted, THE App SHALL save the updated transaction list to Local_Storage.
3. WHEN the App loads, THE App SHALL read all previously stored transactions from Local_Storage and render them in the Transaction_List, balance display, and Chart.
4. IF Local_Storage is unavailable, THEN THE App SHALL display a warning message indicating that data will not be persisted.

---

### Requirement 6: Custom Categories

**User Story:** As a user, I want to add custom categories, so that I can organize my spending beyond the default options.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a control that allows the user to define a new category by entering a name.
2. WHEN a custom category is created, THE App SHALL add it to the category selector and make it available for future transactions.
3. WHEN a custom category is created, THE App SHALL persist the custom category list to Local_Storage.
4. WHEN the App loads, THE App SHALL restore all previously saved custom categories into the category selector.
5. IF the user attempts to create a category with a name that already exists (case-insensitive), THEN THE Input_Form SHALL display an error and SHALL NOT add a duplicate category.

---

### Requirement 7: Monthly Summary View

**User Story:** As a user, I want to view a summary of my spending for a specific month, so that I can track my budget over time.

#### Acceptance Criteria

1. THE App SHALL provide a month selector control that allows the user to filter transactions by calendar month and year.
2. WHEN a month is selected, THE Transaction_List SHALL display only transactions recorded in that month.
3. WHEN a month is selected, THE Chart SHALL display spending distribution for only the transactions in that month.
4. WHEN a month is selected, THE App SHALL display the total balance for only the transactions in that month.
5. WHEN the month filter is cleared, THE App SHALL revert to displaying all transactions.

---

### Requirement 8: Transaction Sorting

**User Story:** As a user, I want to sort my transactions by amount or category, so that I can find and analyze my spending more easily.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide a sort control with options to sort by amount (ascending and descending) and by category (alphabetical).
2. WHEN a sort option is selected, THE Transaction_List SHALL reorder the displayed transactions accordingly without modifying the stored order.
3. WHEN a transaction is added or deleted while a sort is active, THE Transaction_List SHALL maintain the selected sort order.

---

### Requirement 9: Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone, so that I can track spending on the go.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to screen widths from 320px to 1440px.
2. THE Input_Form, Transaction_List, and Chart SHALL each be fully usable on a touch screen without horizontal scrolling.
3. THE App SHALL use a single CSS file located at `css/styles.css` and a single JavaScript file located at `js/app.js`.

---

### Requirement 10: Technical Constraints

**User Story:** As a developer, I want the app to use only HTML, CSS, and Vanilla JavaScript, so that it requires no build tools or server setup.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no frontend frameworks.
2. THE App SHALL require no backend server and SHALL be runnable by opening a single HTML file in a browser.
3. THE App SHALL function correctly in current stable versions of Chrome, Firefox, Edge, and Safari.
4. THE App SHALL load and become interactive in under 3 seconds on a standard broadband connection.
