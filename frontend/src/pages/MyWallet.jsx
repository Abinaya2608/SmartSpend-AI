
import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  RefreshCw,
  CalendarDays
} from 'lucide-react';

import API from '../services/api';
import './MyWallet.css';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));

function MyWallet() {
  const today = new Date();

  const [summary, setSummary] = useState({
    total_balance: 0,
    total_income: 0,
    total_expenses: 0,
    monthly_income: 0,
    monthly_expenses: 0
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(today.getFullYear()));
  const [type, setType] = useState('');

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};

      if (month) params.month = month;
      if (year) params.year = year;
      if (type) params.type = type;

      const response = await API.get('/wallet', { params });

      setSummary(response.data.summary);
      setPaymentMethods(response.data.payment_methods || []);
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('Wallet error:', err.response?.data || err);
      setError(
        err.response?.data?.message ||
        'Unable to load wallet information.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [month, year, type]);

  const formatDate = (dateValue) => {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  };

  return (
    <div className="wallet-page">

      <div className="wallet-page-header">
        <div>
          <p className="wallet-eyebrow">FINANCIAL OVERVIEW</p>
          <h1>My Wallet</h1>
          <p className="wallet-subtitle">
            Keep track of your balance, income and expenses.
          </p>
        </div>

        <button
          className="wallet-refresh-btn"
          onClick={fetchWallet}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="wallet-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="wallet-loading">
          <RefreshCw size={22} className="wallet-spinner" />
          <span>Loading wallet information...</span>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <section className="wallet-balance-card">
            <div className="wallet-balance-top">
              <div className="wallet-balance-icon">
                <Wallet size={23} />
              </div>
              <span>OVERALL BALANCE</span>
            </div>

            <h2>{currency(summary.total_balance)}</h2>

            <p>
              Your recorded income minus your recorded expenses
            </p>

            <div className="wallet-balance-footer">
              <div>
                <span>Total income</span>
                <strong>{currency(summary.total_income)}</strong>
              </div>

              <div>
                <span>Total expenses</span>
                <strong>{currency(summary.total_expenses)}</strong>
              </div>
            </div>
          </section>

          {/* Summary cards */}
          <section className="wallet-summary-grid">

            <div className="wallet-summary-card">
              <div className="wallet-summary-heading">
                <span className="wallet-icon income-icon">
                  <TrendingUp size={20} />
                </span>
                <span>Total Income</span>
              </div>

              <h3>{currency(summary.total_income)}</h3>
              <p>All recorded income</p>
            </div>

            <div className="wallet-summary-card">
              <div className="wallet-summary-heading">
                <span className="wallet-icon expense-icon">
                  <TrendingDown size={20} />
                </span>
                <span>Total Expenses</span>
              </div>

              <h3>{currency(summary.total_expenses)}</h3>
              <p>All recorded expenses</p>
            </div>

            <div className="wallet-summary-card">
              <div className="wallet-summary-heading">
                <span className="wallet-icon monthly-income-icon">
                  <ArrowUpRight size={20} />
                </span>
                <span>This Month's Income</span>
              </div>

              <h3>{currency(summary.monthly_income)}</h3>
              <p>Income recorded this month</p>
            </div>

            <div className="wallet-summary-card">
              <div className="wallet-summary-heading">
                <span className="wallet-icon monthly-expense-icon">
                  <ArrowDownRight size={20} />
                </span>
                <span>This Month's Expenses</span>
              </div>

              <h3>{currency(summary.monthly_expenses)}</h3>
              <p>Expenses recorded this month</p>
            </div>

          </section>

          {/* Payment methods */}
          <section className="wallet-section">
            <div className="wallet-section-header">
              <div>
                <h2>Payment Methods</h2>
                <p>How your recorded expenses are paid.</p>
              </div>
              <CreditCard size={21} />
            </div>

            {paymentMethods.length === 0 ? (
              <div className="wallet-empty-small">
                No payment method data available yet.
              </div>
            ) : (
              <div className="payment-method-grid">
                {paymentMethods.map((method) => (
                  <div
                    className="payment-method-card"
                    key={method.name}
                  >
                    <div className="payment-method-icon">
                      <CreditCard size={19} />
                    </div>

                    <div>
                      <span>{method.name}</span>
                      <strong>{currency(method.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Transaction history */}
          <section className="wallet-section">
            <div className="wallet-section-header wallet-history-header">
              <div>
                <h2>Transaction History</h2>
                <p>
                  {transactions.length} transaction(s) found.
                </p>
              </div>

              <CalendarDays size={21} />
            </div>

            <div className="wallet-filters">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Filter by month"
              >
                <option value="">All months</option>
                {[
                  'January', 'February', 'March', 'April',
                  'May', 'June', 'July', 'August',
                  'September', 'October', 'November', 'December'
                ].map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Filter by year"
              >
                <option value="">All years</option>
                {Array.from(
                  { length: 7 },
                  (_, index) => today.getFullYear() - index
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter by transaction type"
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {transactions.length === 0 ? (
              <div className="wallet-empty">
                <Wallet size={34} />
                <h3>No transactions found</h3>
                <p>
                  Your transactions will appear here when you add them.
                </p>
              </div>
            ) : (
              <div className="wallet-table-wrapper">
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="wallet-transaction-title">
                            <span
                              className={`transaction-type-icon ${
                                transaction.type === 'income'
                                  ? 'transaction-income'
                                  : 'transaction-expense'
                              }`}
                            >
                              {transaction.type === 'income'
                                ? <ArrowDownRight size={17} />
                                : <ArrowUpRight size={17} />
                              }
                            </span>

                            <strong>{transaction.title}</strong>
                          </div>
                        </td>

                        <td>{transaction.category}</td>
                        <td>{formatDate(transaction.date)}</td>
                        <td>{transaction.payment_method}</td>

                        <td>
                          <strong
                            className={
                              transaction.type === 'income'
                                ? 'wallet-income-amount'
                                : 'wallet-expense-amount'
                            }
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {currency(transaction.amount)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default MyWallet;
