/**
 * Finances Module for LifeOS
 * Clean Apple Human Interface Guidelines (HIG) Design System
 * 
 * Features:
 * - Dual currency: USD and LBP (Lebanese Lira)
 * - Monthly financial metrics (Income, Expenses, Net Savings)
 * - Apple-style segmented transaction logger (zero emojis)
 * - Chronological transaction records with quick deletion
 */

import { getState, addTransaction, deleteTransaction, setSettings } from './store.js';
import { getLocalDateString, formatDisplayDate } from './dateUtils.js';

export function renderFinances(container) {
  const state = getState();
  const currency = state.settings.currency || 'USD';
  const lbpRate = state.settings.lbpRate || 89500;
  const transactions = state.finances.transactions || [];

  // Calculate monthly stats for current month
  const currentMonthPrefix = getLocalDateString().substring(0, 7); // 'YYYY-MM'

  let monthlyIncomeUsd = 0;
  let monthlyExpenseUsd = 0;

  transactions.forEach(t => {
    if (t.date && t.date.startsWith(currentMonthPrefix)) {
      const amountInUsd = t.currency === 'LBP' ? (t.amount / lbpRate) : t.amount;
      if (t.type === 'income') {
        monthlyIncomeUsd += amountInUsd;
      } else {
        monthlyExpenseUsd += amountInUsd;
      }
    }
  });

  const netSavingsUsd = monthlyIncomeUsd - monthlyExpenseUsd;

  // Format currency helper
  const fmt = (usdAmount) => {
    if (currency === 'LBP') {
      const lbpVal = Math.round(usdAmount * lbpRate);
      return `${lbpVal.toLocaleString()} LBP`;
    }
    return `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  container.innerHTML = `
    <div class="finances-cockpit">
      
      <!-- Top Balance & Currency Header -->
      <div class="finance-header-card glass-panel">
        <div class="header-info">
          <div class="apple-eyebrow">Cashflow Overview</div>
          <h2 class="cockpit-title">Monthly Cashflow</h2>
        </div>

        <div class="currency-toggle-cluster">
          <span class="curr-label">Currency:</span>
          <div class="apple-segmented-control mini">
            <button class="seg-item ${currency === 'USD' ? 'active' : ''}" data-curr="USD">USD ($)</button>
            <button class="seg-item ${currency === 'LBP' ? 'active' : ''}" data-curr="LBP">LBP (LL)</button>
          </div>
        </div>
      </div>

      <!-- Monthly Summary Metrics -->
      <div class="finance-metrics-grid">
        <div class="fin-metric-card glass-panel income-card">
          <div class="fin-metric-label">Income (This Month)</div>
          <div class="fin-metric-val">+${fmt(monthlyIncomeUsd)}</div>
        </div>

        <div class="fin-metric-card glass-panel expense-card">
          <div class="fin-metric-label">Expenses (This Month)</div>
          <div class="fin-metric-val">-${fmt(monthlyExpenseUsd)}</div>
        </div>

        <div class="fin-metric-card glass-panel savings-card ${netSavingsUsd >= 0 ? 'positive' : 'negative'}">
          <div class="fin-metric-label">Net Savings</div>
          <div class="fin-metric-val">${netSavingsUsd >= 0 ? '+' : ''}${fmt(netSavingsUsd)}</div>
        </div>
      </div>

      <!-- Quick Add Transaction Card -->
      <div class="finance-logger-card glass-panel">
        <h3 class="section-title">Record Entry</h3>
        <form id="add-transaction-form" class="transaction-form">
          
          <div class="apple-segmented-control" style="margin-bottom: 14px;">
            <button type="button" class="seg-item fin-type-btn active" data-type="expense">Expense</button>
            <button type="button" class="seg-item fin-type-btn" data-type="income">Income</button>
          </div>

          <div class="form-row-multi">
            <div class="form-field field-amount">
              <label>Amount</label>
              <div class="amount-input-wrap">
                <input type="number" id="tx-amount" class="apple-input" placeholder="0.00" step="any" min="0.01" required />
                <select id="tx-currency" class="apple-select">
                  <option value="USD">USD ($)</option>
                  <option value="LBP">LBP (LL)</option>
                </select>
              </div>
            </div>

            <div class="form-field field-cat">
              <label>Category</label>
              <select id="tx-category" class="apple-select">
                <option value="Client Payment">Client Payment (Novu)</option>
                <option value="Salary">Salary</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Cloud & Tech">Cloud & Tech Services</option>
                <option value="Groceries">Groceries</option>
                <option value="Utilities & Bills">Utilities & Bills</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div class="form-row-multi">
            <div class="form-field field-desc">
              <label>Description</label>
              <input type="text" id="tx-description" class="apple-input" placeholder="e.g. Restaurant client retainer, Morning coffee" required />
            </div>

            <div class="form-field field-date">
              <label>Date</label>
              <input type="date" id="tx-date" class="apple-input" value="${getLocalDateString()}" />
            </div>
          </div>

          <button type="submit" id="submit-tx-btn" class="apple-primary-btn" style="width: 100%; margin-top: 10px;">
            <span>Save Entry</span>
          </button>
        </form>
      </div>

      <!-- Transactions History List -->
      <div class="transactions-section glass-panel">
        <div class="tx-header-row">
          <h3 class="section-title">Recent Transactions (${transactions.length})</h3>
        </div>

        <div class="transactions-list">
          ${transactions.length > 0 ? transactions.map(t => renderTransactionItem(t, lbpRate, currency)).join('') : `
            <div class="empty-state-notice">No entries recorded. Log an income or expense above.</div>
          `}
        </div>
      </div>

    </div>
  `;

  attachFinanceEvents(container);
}

function renderTransactionItem(tx, lbpRate, displayCurrency) {
  const isIncome = tx.type === 'income';
  let formattedAmount = '';

  if (displayCurrency === 'LBP') {
    const val = tx.currency === 'LBP' ? tx.amount : Math.round(tx.amount * lbpRate);
    formattedAmount = `${val.toLocaleString()} LBP`;
  } else {
    const val = tx.currency === 'USD' ? tx.amount : (tx.amount / lbpRate);
    formattedAmount = `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `
    <div class="transaction-item ${isIncome ? 'tx-income' : 'tx-expense'}" data-id="${tx.id}">
      <div class="tx-icon-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="tx-svg">
          ${isIncome ? '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>' : '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>'}
        </svg>
      </div>

      <div class="tx-main-info">
        <div class="tx-desc-line">
          <span class="tx-desc">${escapeHtml(tx.description)}</span>
          <span class="tx-category-badge">${escapeHtml(tx.category)}</span>
        </div>
        <div class="tx-date-line">
          <span>${formatDisplayDate(tx.date)}</span>
          ${tx.currency !== displayCurrency ? `<span class="orig-curr-hint">(recorded in ${tx.amount.toLocaleString()} ${tx.currency})</span>` : ''}
        </div>
      </div>

      <div class="tx-amount-col">
        <span class="tx-amount-display ${isIncome ? 'income-val' : 'expense-val'}">
          ${isIncome ? '+' : '-'}${formattedAmount}
        </span>
        <button class="delete-tx-btn" data-id="${tx.id}" title="Remove entry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trash-icon"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>
    </div>
  `;
}

function attachFinanceEvents(container) {
  // Currency toggle
  container.querySelectorAll('.currency-toggle-cluster .seg-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const curr = btn.getAttribute('data-curr');
      setSettings({ currency: curr });
      renderFinances(container);
    });
  });

  // Type toggle (Expense vs Income)
  let selectedType = 'expense';
  container.querySelectorAll('.fin-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.fin-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.getAttribute('data-type');
    });
  });

  // Transaction form submit
  const form = container.querySelector('#add-transaction-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = container.querySelector('#tx-amount');
      const currInput = container.querySelector('#tx-currency');
      const catInput = container.querySelector('#tx-category');
      const descInput = container.querySelector('#tx-description');
      const dateInput = container.querySelector('#tx-date');

      const amount = parseFloat(amountInput.value);
      const currency = currInput.value;
      const category = catInput.value;
      const description = descInput.value.trim();
      const date = dateInput.value || getLocalDateString();

      if (amount > 0 && description) {
        addTransaction({
          type: selectedType,
          amount,
          currency,
          category,
          description,
          date
        });
        renderFinances(container);
      }
    });
  }

  // Delete transaction
  container.querySelectorAll('.delete-tx-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteTransaction(id);
      renderFinances(container);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
