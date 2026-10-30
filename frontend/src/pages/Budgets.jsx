
import BudgetPanel from '../components/BudgetPanel';

function Budgets() {
  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Budgets</h2>
        <p className="text-muted mb-0">
          Set monthly spending limits and track your budget.
        </p>
      </div>

      <div style={{ maxWidth: '850px' }}>
        <BudgetPanel />
      </div>
    </div>
  );
}

export default Budgets;
