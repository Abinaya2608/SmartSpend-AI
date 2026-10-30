
import { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  ReceiptText,
  ChartNoAxesCombined,
  Target,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import MyWallet from './pages/MyWallet';
import Settings from './pages/Settings';
import { logoutUser } from './services/authService';
import './App.css';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Transactions', icon: ReceiptText },
    { name: 'Budgets', icon: Target },
    { name: 'Analytics', icon: ChartNoAxesCombined },
    { name: 'My Wallet', icon: Wallet }
  ];

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setActivePage('Dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setActivePage('Dashboard');
  };

  if (!user || !localStorage.getItem('access_token')) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={23} />
          </div>
          <span>
            SmartSpend<span className="brand-ai"> AI</span>
          </span>
        </div>

        <div className="sidebar-section-label">MENU</div>

        <nav className="sidebar-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? 'active' : ''
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-section-label">PREFERENCES</div>

          <button
            className={`nav-item ${
              activePage === 'Settings' ? 'active' : ''
            }`}
            onClick={() => {
              setActivePage('Settings');
              setSidebarOpen(false);
            }}
          >
            <SettingsIcon size={19} />
            <span>Settings</span>
          </button>

          <button
            className="nav-item logout-item"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Log out</span>
          </button>

          <div className="sidebar-profile">
            <div className="profile-avatar">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{user.name}</strong>
              <span>Personal Account</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
  {activePage === 'Transactions' ? (
    <Transactions />
  ) : activePage === 'Budgets' ? (
    <Budgets />
  ) : activePage === 'Analytics' ? (
    <Analytics />
  ) : activePage === 'My Wallet' ? (
    <MyWallet />
  ) : activePage === 'Settings' ? (
    <Settings
      user={user}
      onProfileUpdated={setUser}
      onLogout={handleLogout}
    />
  ) : (
    <Dashboard activePage={activePage} />
  )}
</main>
    </div>
  );
}

export default App;
