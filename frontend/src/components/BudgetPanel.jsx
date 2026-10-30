
import { useEffect, useState, useCallback } from 'react';
import {
  Target, Save, LoaderCircle, Trash2,
  ChevronLeft, ChevronRight, History
} from 'lucide-react';
import API from '../services/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function BudgetPanel() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const monthName = new Date(year, month - 1, 1)
    .toLocaleString('en-IN', { month: 'long' });

  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/budgets', {
        params: { month, year }
      });

      const savedBudget = response.data.budget;
      setBudget(savedBudget);
      setAmount(savedBudget ? String(savedBudget.total_limit) : '');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load budget.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchHistory = async () => {
    try {
      const response = await API.get('/budgets/history');
      setHistory(response.data.budgets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load history.');
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const changeMonth = (direction) => {
    const next = new Date(year, month - 1 + direction, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid budget amount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await API.post('/budgets', {
        month, year, total_limit: value
      });

      setBudget(response.data.budget);
      setSuccess(response.data.message);

      if (showHistory) await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!budget || !window.confirm('Delete this monthly budget?')) return;

    try {
      await API.delete(`/budgets/${budget.id}`);
      setBudget(null);
      setAmount('');
      setSuccess('Budget deleted successfully.');
      if (showHistory) await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete budget.');
    }
  };

  const spent = Number(budget?.total_expenses || 0);
  const limit = Number(budget?.total_limit || 0);
  const remaining = Number(budget?.remaining || 0);
  const percentage = Number(budget?.percentage || 0);

  const status = budget?.status || 'NORMAL';

  return (
    <div className="dashboard-panel budget-panel">
      <div className="panel-header">
        <div>
          <h3>Monthly Budget</h3>
          <p>Your spending limit</p>
        </div>
        <Target size={21} color="#7968e8" />
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <button type="button" className="btn btn-light btn-sm"
          onClick={() => changeMonth(-1)}>
          <ChevronLeft size={17} />
        </button>

        <strong>{monthName} {year}</strong>

        <button type="button" className="btn btn-light btn-sm"
          onClick={() => changeMonth(1)}
          disabled={year === today.getFullYear() && month === today.getMonth() + 1}>
          <ChevronRight size={17} />
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Loading budget...</p>
      ) : (
        <>
          <form onSubmit={handleSave}>
            <label className="form-label fw-semibold">
              Monthly budget limit (₹)
            </label>

            <div className="d-flex gap-2 mb-3">
              <input
                type="number"
                className="form-control"
                placeholder="Enter budget amount"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <button type="submit" className="btn btn-primary"
                disabled={saving}>
                {saving ? <LoaderCircle size={17} /> : <Save size={17} />}
              </button>
            </div>
          </form>

          {budget ? (
            <>
              <div className="budget-amount">
                <h2>
                  {formatCurrency(spent)}
                  <span> / {formatCurrency(limit)}</span>
                </h2>
                <strong>{percentage.toFixed(1)}%</strong>
              </div>

              <div className="budget-progress">
                <div
                  className="budget-progress-fill"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor:
                      status === 'EXCEEDED' ? '#e05252' :
                      status === 'WARNING' ? '#e6a23c' : '#7968e8'
                  }}
                />
              </div>

              <div className="budget-footer">
                <span>{formatCurrency(Math.max(remaining, 0))} remaining</span>
                <span>{monthName} {year}</span>
              </div>

              {status === 'WARNING' && (
                <p className="text-warning small mt-2">
                  You have used at least 80% of your monthly budget.
                </p>
              )}

              {status === 'EXCEEDED' && (
                <p className="text-danger small mt-2">
                  Budget exceeded by {formatCurrency(Math.abs(remaining))}.
                </p>
              )}

              <button type="button" onClick={handleDelete}
                className="btn btn-outline-danger btn-sm mt-2">
                <Trash2 size={15} /> Delete budget
              </button>
            </>
          ) : (
            <p className="text-muted small">
              No budget set for {monthName} {year}. Enter an amount above
              to create one.
            </p>
          )}
        </>
      )}

      {error && <p className="text-danger small mt-2">{error}</p>}
      {success && <p className="text-success small mt-2">{success}</p>}

      <hr />

      <button
        type="button"
        className="btn btn-light btn-sm w-100"
        onClick={async () => {
          if (!showHistory) await fetchHistory();
          setShowHistory(!showHistory);
        }}
      >
        <History size={16} /> {showHistory ? 'Hide budget history' : 'View budget history'}
      </button>

      {showHistory && (
        <div className="mt-3">
          {history.length === 0 ? (
            <p className="text-muted small">No previous budgets found.</p>
          ) : (
            history.map((item) => (
              <div key={item.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <strong className="small">
                    {new Date(item.year, item.month - 1)
                      .toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                  </strong>
                  <p className="small text-muted mb-0">
                    Spent: {formatCurrency(item.total_expenses)}
                  </p>
                </div>
                <strong className="small">
                  {formatCurrency(item.total_limit)}
                </strong>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default BudgetPanel;
