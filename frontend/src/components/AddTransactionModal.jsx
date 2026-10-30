
import { useState } from 'react';
import { X, Plus } from 'lucide-react';

function AddTransactionModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'expense',
    amount: '',
    category: 'Food & Dining',
    payment_method: 'UPI',
    date: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const categories = {
    expense: [
      'Food & Dining',
      'Shopping',
      'Transportation',
      'Healthcare',
      'Education',
      'Entertainment',
      'Bills & Utilities',
      'Others'
    ],
    income: [
      'Salary',
      'Freelance',
      'Business',
      'Investment',
      'Gift',
      'Others'
    ]
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'type'
        ? { category: value === 'income' ? 'Salary' : 'Food & Dining' }
        : {})
    }));

    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError('Please enter a transaction title.');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    onAdd({
      ...formData,
      amount: Number(formData.amount)
    });

    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onMouseDown={onClose}>
      <div
        className="transaction-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div>
            <h2>Add Transaction</h2>
            <p>Record your income or expenses.</p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="transaction-type-selector">
            <button
              type="button"
              className={formData.type === 'expense' ? 'selected-expense' : ''}
              onClick={() =>
                handleChange({
                  target: { name: 'type', value: 'expense' }
                })
              }
            >
              Expense
            </button>

            <button
              type="button"
              className={formData.type === 'income' ? 'selected-income' : ''}
              onClick={() =>
                handleChange({
                  target: { name: 'type', value: 'income' }
                })
              }
            >
              Income
            </button>
          </div>

          <div className="form-field">
            <label>Transaction Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Grocery shopping"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories[formData.type].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Transaction Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="save-transaction-btn">
              <Plus size={16} />
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
