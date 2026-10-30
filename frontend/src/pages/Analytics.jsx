
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import API from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function Analytics() {
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState('6');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const [monthlyResponse, categoryResponse] = await Promise.all([
          API.get('/analytics/monthly', {
            params: { months: period }
          }),
          API.get('/analytics/categories')
        ]);

        setMonthly(monthlyResponse.data.months || []);
        setCategories(categoryResponse.data.categories || []);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Unable to load analytics.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const labels = monthly.map(item => item.label);

  const monthlyData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: monthly.map(item => Number(item.income || 0)),
        backgroundColor: '#26a69a',
        borderRadius: 6
      },
      {
        label: 'Expenses',
        data: monthly.map(item => Number(item.expenses || 0)),
        backgroundColor: '#ef6b73',
        borderRadius: 6
      }
    ]
  };

  const savingsData = {
    labels,
    datasets: [
      {
        label: 'Savings',
        data: monthly.map(item => Number(item.savings || 0)),
        borderColor: '#7968e8',
        backgroundColor: 'rgba(121,104,232,0.12)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const categoryData = {
    labels: categories.map(item => item.category),
    datasets: [
      {
        data: categories.map(item => Number(item.total || 0)),
        backgroundColor: [
          '#7968e8',
          '#26a69a',
          '#f4b942',
          '#ef6b73',
          '#5794e8',
          '#a78bfa',
          '#f28b50',
          '#69b7c5'
        ],
        borderWidth: 0
      }
    ]
  };

  const comparisonData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        label: 'Total Amount',
        data: [
          monthly.reduce((sum, item) => sum + Number(item.income || 0), 0),
          monthly.reduce((sum, item) => sum + Number(item.expenses || 0), 0)
        ],
        backgroundColor: ['#26a69a', '#ef6b73'],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => '₹' + Number(value).toLocaleString('en-IN')
        }
      }
    }
  };

  const totalIncome = monthly.reduce(
    (sum, item) => sum + Number(item.income || 0), 0
  );

  const totalExpenses = monthly.reduce(
    (sum, item) => sum + Number(item.expenses || 0), 0
  );

  const totalSavings = monthly.reduce(
    (sum, item) => sum + Number(item.savings || 0), 0
  );

  if (loading) {
    return <div className="container-fluid py-4">Loading analytics...</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Analytics</h2>
          <p className="text-muted mb-0">
            Visualize your income, expenses and savings.
          </p>
        </div>

        <select
          className="form-select"
          style={{ width: '160px' }}
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && monthly.length === 0 ? (
        <div className="alert alert-info">
          No monthly transaction data available yet.
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Total Income</p>
                <h4 className="fw-bold text-success mb-0">
                  {formatCurrency(totalIncome)}
                </h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Total Expenses</p>
                <h4 className="fw-bold text-danger mb-0">
                  {formatCurrency(totalExpenses)}
                </h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Net Savings</p>
                <h4 className={`fw-bold mb-0 ${
                  totalSavings >= 0 ? 'text-primary' : 'text-danger'
                }`}>
                  {formatCurrency(totalSavings)}
                </h4>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4">
                  Monthly Income vs Expenses
                </h5>
                <div style={{ height: '320px' }}>
                  <Bar data={monthlyData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4">
                  Expense Distribution
                </h5>
                {categories.length > 0 ? (
                  <div style={{ height: '320px' }}>
                    <Doughnut
                      data={categoryData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-muted">No expense categories available.</p>
                )}
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4">Monthly Savings Trend</h5>
                <div style={{ height: '300px' }}>
                  <Line data={savingsData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4">Income vs Expenses Summary</h5>
                <div style={{ height: '300px' }}>
                  <Bar
                    data={comparisonData}
                    options={{
                      ...chartOptions,
                      indexAxis: 'y'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
