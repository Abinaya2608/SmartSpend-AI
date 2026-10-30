
import { useEffect, useState } from 'react';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import API from '../services/api';
import './AIInsights.css';

function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/ai/insights');

      setInsights(response.data.insights || []);

    } catch (err) {
      console.error(
        'AI insights error:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        'Unable to generate AI insights.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <section className="ai-insights-panel">

      <div className="ai-insights-header">
        <div className="ai-insights-heading">
          <div className="ai-insights-icon">
            <BrainCircuit size={21} />
          </div>

          <div>
            <h3>SmartSpend AI Insights</h3>
            <p>Personalized analysis of your spending</p>
          </div>
        </div>

        <button
          type="button"
          className="ai-refresh-btn"
          onClick={fetchInsights}
          disabled={loading}
          title="Refresh AI insights"
        >
          <RefreshCw
            size={17}
            className={loading ? 'ai-spinning' : ''}
          />
        </button>
      </div>

      {loading ? (
        <div className="ai-loading">
          <Sparkles size={20} />
          <span>Analyzing your financial data...</span>
        </div>
      ) : error ? (
        <div className="ai-error">
          <p>{error}</p>

          <button type="button" onClick={fetchInsights}>
            Try again
          </button>
        </div>
      ) : (
        <div className="ai-insights-list">

          {insights.map((insight, index) => (
            <div className="ai-insight-item" key={index}>

              <div className="ai-insight-number">
                {index + 1}
              </div>

              <div className="ai-insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>

            </div>
          ))}

        </div>
      )}

      <div className="ai-powered-label">
        <Sparkles size={13} />
        Powered by Google Gemini
      </div>

    </section>
  );
}

export default AIInsights;
