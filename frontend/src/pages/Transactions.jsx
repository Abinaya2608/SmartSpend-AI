
import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Trash2, RefreshCw, ReceiptText,
  TrendingUp, TrendingDown
} from 'lucide-react';
import API from '../services/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function Transactions() {
  const today = new Date();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [typeFilter, setTypeFilter] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: 'expense',
    amount: '',
    category: '',
    payment_method: 'UPI',
    date: today.toISOString().slice(0, 10)
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      if (typeFilter) params.type = typeFilter;

      const response = await API.get('/transactions', { params });
      setTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load transactions.'
      );
    } finally {
      setLoading(false);
    }
  }, [month, year, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!form.title.trim() || !form.category.trim()) {
      setError('Enter a transaction title and category.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid transaction amount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await API.post('/transactions', {
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        amount
      });

      setForm({
        title: '',
        type: 'expense',
        amount: '',
        category: '',
        payment_method: 'UPI',
        date: today.toISOString().slice(0, 10)
      });

      setSuccess('Transaction added successfully.');
      await fetchTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to add transaction.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await API.delete(`/transactions/${id}`);
      setSuccess('Transaction deleted successfully.');
      await fetchTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to delete transaction.'
      );
    }
  };

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Transactions</h2>
          <p className="text-muted mb-0">
            Manage your income and expenses.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={fetchTransactions}
          type="button"
        >
          <RefreshCw size={16} className="me-2" />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-success-subtle p-3">
                <TrendingUp color="#198754" />
              </div>
              <div>
                <p className="text-muted mb-1">Total Income</p>
                <h4 className="fw-bold mb-0">
                  {formatCurrency(totalIncome)}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-danger-subtle p-3">
                <TrendingDown color="#dc3545" />
              </div>
              <div>
                <p className="text-muted mb-1">Total Expenses</p>
                <h4 className="fw-bold mb-0">
                  {formatCurrency(totalExpenses)}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h5 className="fw-bold mb-3">
          <Plus size={19} className="me-2" />
          Add Transaction
        </h5>

        <form onSubmit={handleAdd}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="e.g. Grocery shopping"
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                name="type"
                value={form.type}
                onChange={handleFormChange}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-control"
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleFormChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                placeholder="e.g. Food, Salary, Travel"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                name="payment_method"
                value={form.payment_method}
                onChange={handleFormChange}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input
                className="form-control"
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <h5 className="fw-bold mb-0">
            <ReceiptText size={19} className="me-2" />
            Transaction History
          </h5>

          <div className="d-flex flex-wrap gap-2">
            <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en-IN', {
                    month: 'long'
                  })}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {Array.from({ length: 6 }, (_, i) => (
                <option key={today.getFullYear() - i}>
                  {today.getFullYear() - i}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-muted">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5">
            <ReceiptText size={35} className="text-muted mb-2" />
            <p className="text-muted mb-0">No transactions found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.title}</td>
                    <td>{item.category || 'Others'}</td>
                    <td>{item.date}</td>
                    <td>{item.payment_method}</td>
                    <td>
                      <span className={`badge ${
                        item.type === 'income'
                          ? 'bg-success-subtle text-success'
                          : 'bg-danger-subtle text-danger'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className={`text-end fw-semibold ${
                      item.type === 'income' ? 'text-success' : 'text-danger'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        title="Delete transaction"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
