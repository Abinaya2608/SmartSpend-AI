
import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import BudgetPanel from '../components/BudgetPanel';
import AIInsights from '../components/AIInsights';
import ExpenseAnomalies from '../components/ExpenseAnomalies';

import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  CalendarDays,
  ArrowRight,
  ReceiptText,
  Trash2
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

import { Bar } from 'react-chartjs-2';
import AddTransactionModal from '../components/AddTransactionModal';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);


// FORMAT CURRENCY
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}


// FORMAT TRANSACTION
function formatTransaction(transaction) {
  const isIncome = transaction.type === 'income';

  return {
    ...transaction,
    amount: isIncome
      ? Number(transaction.amount)
      : -Number(transaction.amount),

    category:
      typeof transaction.category === 'object'
        ? transaction.category?.name || 'Others'
        : transaction.category || 'Others',

    date: transaction.date,

    icon: isIncome ? Wallet : ReceiptText,
    color: isIncome ? '#e5f8ef' : '#efedff',
    iconColor: isIncome ? '#2ca66b' : '#7665e8'
  };
}


function Dashboard({ activePage }) {

  // STATES
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState('');

  const [chartMonths, setChartMonths] = useState(6);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);


  // FETCH TRANSACTIONS
  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionError('');

      const response = await API.get('/transactions');

      const data = response.data;

      const transactionList = Array.isArray(data)
        ? data
        : data.transactions || [];

      setTransactions(transactionList.map(formatTransaction));

    } catch (error) {
      setTransactionError(
        error.response?.data?.message ||
        'Unable to load transactions. Please try again.'
      );
    } finally {
      setLoadingTransactions(false);
    }
  }, []);


  // FETCH MONTHLY ANALYTICS
  const fetchMonthlyAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);

      const response = await API.get(
        `/analytics/monthly?months=${chartMonths}`
      );

      setMonthlyAnalytics(response.data.months || []);

    } catch (error) {
      console.error(
        'Analytics error:',
        error.response?.data || error
      );

      setMonthlyAnalytics([]);

    } finally {
      setLoadingAnalytics(false);
    }
  }, [chartMonths]);


  // INITIAL TRANSACTION FETCH
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);


  // REFRESH ANALYTICS WHEN TRANSACTIONS OR PERIOD CHANGES
  useEffect(() => {
    fetchMonthlyAnalytics();
  }, [fetchMonthlyAnalytics, transactions]);


  // ADD TRANSACTION
  const handleAddTransaction = async (transaction) => {
    try {
      setTransactionError('');

      await API.post('/transactions', {
        title: transaction.title,
        type: transaction.type,
        amount: Number(transaction.amount),
        category: transaction.category,
        payment_method:
          transaction.payment_method || transaction.paymentMethod,
        date: transaction.date
      });

      await fetchTransactions();

      setShowModal(false);

    } catch (error) {
      setTransactionError(
        error.response?.data?.message ||
        'Unable to save transaction. Please try again.'
      );
    }
  };


  // DELETE TRANSACTION
  const handleDeleteTransaction = async (transactionId) => {
    try {
      setTransactionError('');

      await API.delete(`/transactions/${transactionId}`);

      await fetchTransactions();

    } catch (error) {
      console.error(
        'Delete error:',
        error.response?.data || error
      );

      setTransactionError(
        error.response?.data?.message ||
        'Unable to delete transaction. Please try again.'
      );
    }
  };


  // CURRENT DATE
  const now = new Date();

  const currentMonthName = now.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });


  // CURRENT MONTH TRANSACTIONS
  const currentMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(`${transaction.date}T00:00:00`);

    return (
      transactionDate.getMonth() === now.getMonth() &&
      transactionDate.getFullYear() === now.getFullYear()
    );
  });


  // MONTHLY INCOME
  const totalIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );


  // MONTHLY EXPENSES
  const totalExpenses = currentMonthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0
    );


  // MONTHLY SAVINGS
  const totalSavings = totalIncome - totalExpenses;


  // TOTAL BALANCE
  const totalBalance = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );


  // SUMMARY CARDS
  const summaryCards = [
    {
      title: 'Total Balance',
      amount: totalBalance,
      change: '+12.8%',
      description: 'Compared to last month',
      icon: Wallet,
      iconColor: '#7866e8',
      iconBg: '#efedff'
    },
    {
      title: 'Total Income',
      amount: totalIncome,
      change: '+8.2%',
      description: 'Compared to last month',
      icon: TrendingUp,
      iconColor: '#28a879',
      iconBg: '#e6f7ef'
    },
    {
      title: 'Total Expenses',
      amount: totalExpenses,
      change: '-3.4%',
      description: 'Compared to last month',
      icon: TrendingDown,
      iconColor: '#e78b53',
      iconBg: '#fff0e7'
    },
    {
      title: 'Total Savings',
      amount: totalSavings,
      change: '+15.6%',
      description: 'Compared to last month',
      icon: PiggyBank,
      iconColor: '#5595df',
      iconBg: '#eaf2ff'
    }
  ];


  // EXPENSE CATEGORY BREAKDOWN
  const categoryColors = [
    '#7866e8',
    '#f3a45b',
    '#5b9ce8',
    '#e4779c',
    '#53b99a',
    '#e6b94f'
  ];

  const categoryTotals = {};

  currentMonthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const category = transaction.category;

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Math.abs(transaction.amount);
    });


  const categories = Object.entries(categoryTotals).map(
    ([name, amount], index) => ({
      name,
      amount,
      percentage: totalExpenses > 0
        ? (amount / totalExpenses) * 100
        : 0,
      color: categoryColors[index % categoryColors.length]
    })
  );


  // REAL MONTHLY CHART DATA
  const chartData = {
    labels: monthlyAnalytics.map((month) => month.label),

    datasets: [
      {
        label: 'Income',
        data: monthlyAnalytics.map((month) => month.income),
        backgroundColor: '#7968e8',
        borderRadius: 5,
        barThickness: 13
      },
      {
        label: 'Expenses',
        data: monthlyAnalytics.map((month) => month.expenses),
        backgroundColor: '#e9e6fc',
        borderRadius: 5,
        barThickness: 13
      }
    ]
  };


  // CHART OPTIONS
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',
        align: 'end',

        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          padding: 18,
          color: '#777b91',
          font: { size: 11 }
        }
      },

      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#9295a7',
          font: { size: 11 }
        },
        border: { display: false }
      },

      y: {
        beginAtZero: true,

        grid: { color: '#f0f0f5' },

        ticks: {
          color: '#9295a7',
          font: { size: 10 },
          callback: (value) => `₹${value / 1000}k`
        },

        border: { display: false }
      }
    }
  };


  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">

        <div>
          <p className="page-subtitle">OVERVIEW</p>

          <h1>
            {activePage === 'Dashboard' ? 'Dashboard' : activePage}
          </h1>

          <p className="welcome-text">
            Welcome back! Here's what's happening with your finances.
          </p>
        </div>

        <div className="header-actions">

          <div className="date-display">
            <CalendarDays size={17} />
            {currentMonthName}
          </div>

          <button
            className="add-transaction-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={17} />
            Add Transaction
          </button>

        </div>
      </div>


      {/* SUMMARY CARDS */}
      <div className="summary-grid">

        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="summary-card" key={card.title}>

              <div className="summary-card-top">
                <span>{card.title}</span>

                <div
                  className="summary-icon"
                  style={{
                    backgroundColor: card.iconBg,
                    color: card.iconColor
                  }}
                >
                  <Icon size={19} />
                </div>
              </div>

              <h2>{formatCurrency(card.amount)}</h2>

              <div className="summary-footer">

                <span className="change-positive">
                  <ArrowUpRight size={14} />
                  {card.change}
                </span>

                <span>{card.description}</span>

              </div>
            </div>
          );
        })}

      </div>


      {/* CHARTS */}
      <div className="analytics-grid">

        {/* INCOME VS EXPENSES */}
        <div className="dashboard-panel spending-panel">

          <div className="panel-header">

            <div>
              <h3>Income vs Expenses</h3>
              <p>Your financial overview for the last {chartMonths} months</p>
            </div>

            <select
              className="period-select"
              value={chartMonths}
              onChange={(e) => setChartMonths(Number(e.target.value))}
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>

          </div>

          <div className="chart-container">

            {loadingAnalytics ? (
              <p className="text-muted p-3">
                Loading analytics...
              </p>
            ) : monthlyAnalytics.length === 0 ? (
              <p className="text-muted p-3">
                No analytics data available.
              </p>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}

          </div>

        </div>


        {/* EXPENSE BREAKDOWN */}
        <div className="dashboard-panel category-panel">

          <div className="panel-header">
            <div>
              <h3>Expense Breakdown</h3>
              <p>Where your money goes</p>
            </div>
          </div>

          <div className="category-total">
            <h2>{formatCurrency(totalExpenses)}</h2>
            <span>Total spending this month</span>
          </div>

          <div className="category-list">

            {categories.length === 0 ? (
              <p className="text-muted">
                No expenses recorded this month.
              </p>
            ) : (

              categories.map((category) => (
                <div className="category-item" key={category.name}>

                  <div className="category-info">

                    <div className="category-name">
                      <span
                        className="category-dot"
                        style={{ backgroundColor: category.color }}
                      />

                      {category.name}
                    </div>

                    <strong>
                      {formatCurrency(category.amount)}
                    </strong>

                  </div>

                  <div className="category-progress">
                    <div
                      className="category-progress-fill"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>

                </div>
              ))

            )}

          </div>
        </div>

      </div>


      {/* AI SPENDING INSIGHTS */}
      <AIInsights />
      <ExpenseAnomalies />


      {/* LOWER SECTION */}
      <div className="lower-grid">

        {/* RECENT TRANSACTIONS */}
        <div className="dashboard-panel transactions-panel">

          <div className="panel-header">

            <div>
              <h3>Recent Transactions</h3>
              <p>Your latest financial activities</p>
            </div>

            <button className="view-all-btn">
              View all <ArrowRight size={15} />
            </button>

          </div>

          <div className="transaction-list">

            {loadingTransactions ? (
              <p className="text-muted p-3">
                Loading transactions...
              </p>
            ) : transactionError ? (
              <p className="text-danger p-3">
                {transactionError}
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-muted p-3">
                No transactions yet. Add your first transaction!
              </p>
            ) : (

              transactions.slice(0, 5).map((transaction) => {
                const Icon = transaction.icon;

                return (
                  <div
                    className="transaction-item"
                    key={transaction.id}
                  >

                    <div
                      className="transaction-icon"
                      style={{
                        backgroundColor: transaction.color,
                        color: transaction.iconColor
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="transaction-details">
                      <strong>{transaction.title}</strong>

                      <span>
                        {transaction.category} · {transaction.date}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">

                      <strong
                        className={
                          transaction.amount > 0
                            ? 'transaction-income'
                            : 'transaction-expense'
                        }
                      >
                        {transaction.amount > 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </strong>

                      <button
                        type="button"
                        className="btn btn-sm text-danger"
                        title="Delete transaction"
                        aria-label={`Delete ${transaction.title}`}
                        onClick={() =>
                          handleDeleteTransaction(transaction.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>
                );
              })

            )}

          </div>
        </div>


        {/* BUDGET PANEL */}
        <div className="right-panels">
          <BudgetPanel />
        </div>

      </div>


      {/* DISCLAIMER */}
      <p className="dashboard-disclaimer">
        Your transactions are securely stored in your SmartSpend account.
      </p>


      {/* ADD TRANSACTION MODAL */}
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTransaction}
        />
      )}

    </div>
  );
}

export default Dashboard;
