
import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import API from '../services/api';
import './ExpenseAnomalies.css';

function ExpenseAnomalies() {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await API.get('/analytics/anomalies');

            setAnomalies(response.data.anomalies || []);
        } catch (err) {
            console.error(
                'Anomaly detection error:',
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                'Unable to load expense alerts.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnomalies();
    }, []);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);

    return (
        <section className="anomaly-panel">

            <div className="anomaly-header">
                <div className="anomaly-heading">
                    <div className="anomaly-icon">
                        <AlertTriangle size={21} />
                    </div>

                    <div>
                        <h3>Unusual Spending Alerts</h3>
                        <p>Expenses that differ from your usual spending</p>
                    </div>
                </div>

                <button
                    className="anomaly-refresh"
                    onClick={fetchAnomalies}
                    disabled={loading}
                    title="Refresh alerts"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? 'anomaly-spinning' : ''}
                    />
                </button>
            </div>

            {loading ? (
                <div className="anomaly-message">
                    Analyzing your expense history...
                </div>
            ) : error ? (
                <div className="anomaly-error">
                    {error}
                    <button onClick={fetchAnomalies}>
                        Try again
                    </button>
                </div>
            ) : anomalies.length === 0 ? (
                <div className="anomaly-empty">
                    <ShieldCheck size={30} />
                    <h4>No unusual expenses detected</h4>
                    <p>
                        Your recorded expenses are within the
                        expected spending range.
                    </p>
                </div>
            ) : (
                <div className="anomaly-list">

                    <div className="anomaly-count">
                        {anomalies.length} unusual expense
                        {anomalies.length !== 1 ? 's' : ''} detected
                    </div>

                    {anomalies.map((item) => (
                        <div
                            className="anomaly-item"
                            key={item.transaction_id}
                        >
                            <div className="anomaly-item-main">
                                <div className="anomaly-item-icon">
                                    <AlertTriangle size={19} />
                                </div>

                                <div className="anomaly-details">
                                    <h4>{item.title}</h4>
                                    <p>
                                        {item.category} · {item.date}
                                    </p>
                                    <span>{item.reason}</span>
                                </div>
                            </div>

                            <div className="anomaly-amount">
                                <strong>
                                    {formatCurrency(item.amount)}
                                </strong>

                                <span>
                                    Usual: {formatCurrency(item.usual_amount)}
                                </span>

                                <small className={item.severity.toLowerCase()}>
                                    {item.severity}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="anomaly-footer">
                <ShieldCheck size={14} />
                Based on your previous expense history
            </div>

        </section>
    );
}

export default ExpenseAnomalies;
