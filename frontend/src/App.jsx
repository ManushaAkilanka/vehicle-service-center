import { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage  from './pages/VehiclesPage';
import ServicesPage  from './pages/ServicesPage';
import EmployeesPage from './pages/EmployeesPage';
import NewVisitPage  from './pages/NewVisitPage';
import PaymentPage   from './pages/PaymentPage';
import ReceiptPage   from './pages/ReceiptPage';
import ReportsPage   from './pages/ReportsPage';

const NAV_PAGES = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'vehicles',  label: '🚗 Vehicles'  },
  { id: 'services',  label: '⚙️ Services'  },
  { id: 'employees', label: '👥 Employees' },
  { id: 'newvisit',  label: '📋 New Visit' },
  { id: 'reports',   label: '📊 Reports'   },
];

// Pages that hide the main nav (full-screen steps)
const HIDE_NAV = new Set(['payment', 'receipt']);

export default function App() {
  const [activePage,   setActivePage]   = useState('dashboard');
  const [visitVehicle, setVisitVehicle] = useState(null);
  const [activeVisit,  setActiveVisit]  = useState(null);
  const [toast,        setToast]        = useState('');

  // Check for PayHere payment return URL parameters (order_id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id') || params.get('payhere_order_id');
    if (orderId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      let attempts = 0;
      const maxAttempts = 6;
      const poll = () => {
        fetch(`/api/payments/by-order/${encodeURIComponent(orderId)}?sandbox_confirm=true`)
          .then(r => r.json())
          .then(res => {
            if (res.data && res.data.payment_status === 'paid') {
              setActiveVisit(res.data);
              setActivePage('receipt');
              showToast('✅ Payment confirmed — receipt generated');
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(poll, 1500);
            } else {
              showToast('⚠️ Payment verification pending or not confirmed.');
            }
          })
          .catch(err => console.error('Failed to restore return payment visit:', err));
      };
      poll();
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  /** VehicleCard "🔧 Start New Visit" */
  function handleStartVisit(vehicle) {
    setVisitVehicle(vehicle);
    setActivePage('newvisit');
  }

  /** VisitReceipt "💳 Proceed to Payment" */
  function handlePayment(visit) {
    setActiveVisit(visit);
    setActivePage('payment');
  }

  /** PaymentPage onPaid — show receipt */
  function handlePaid(updatedVisit) {
    setActiveVisit(updatedVisit);
    setActivePage('receipt');
    showToast('✅ Payment confirmed — receipt generated');
  }

  /** PaymentPage / ReceiptPage "Back" */
  function handleBackToVisit() {
    setActivePage('newvisit');
  }

  /** ReceiptPage "＋ New Visit" */
  function handleNewVisit() {
    setActiveVisit(null);
    setVisitVehicle(null);
    setActivePage('newvisit');
  }

  function goTo(pageId) {
    if (pageId !== 'newvisit') setVisitVehicle(null);
    setActivePage(pageId);
  }

  const hideNav = HIDE_NAV.has(activePage);

  return (
    <div className="app">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🔧</div>
          <div>
            <div className="header-title">Lanka Vehicle Service Centre</div>
            <div className="header-subtitle">Management System</div>
          </div>
        </div>

        {!hideNav ? (
          <nav className="nav-tabs" aria-label="Main navigation">
            {NAV_PAGES.map(p => (
              <button
                key={p.id}
                id={`nav-${p.id}`}
                className={`nav-tab${activePage === p.id ? ' active' : ''}`}
                onClick={() => goTo(p.id)}
              >
                {p.label}
              </button>
            ))}
          </nav>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {activePage === 'payment' ? '💳 Payment' : '🧾 Receipt'}
            </span>
            <button
              className="btn-secondary"
              style={{ height: 38, fontSize: 13 }}
              onClick={() => setActivePage('dashboard')}
            >
              ← Dashboard
            </button>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="main">
        {activePage === 'dashboard' && (
          <DashboardPage onGoTo={goTo} />
        )}
        {activePage === 'vehicles' && (
          <VehiclesPage onToast={showToast} onStartVisit={handleStartVisit} />
        )}
        {activePage === 'services' && (
          <ServicesPage onToast={showToast} />
        )}
        {activePage === 'employees' && (
          <EmployeesPage onToast={showToast} />
        )}
        {activePage === 'newvisit' && (
          <NewVisitPage
            preselectedVehicle={visitVehicle}
            onToast={showToast}
            onPayment={handlePayment}
          />
        )}
        {activePage === 'payment' && activeVisit && (
          <PaymentPage
            visit={activeVisit}
            onPaid={handlePaid}
            onBack={handleBackToVisit}
          />
        )}
        {activePage === 'receipt' && activeVisit && (
          <ReceiptPage
            visit={activeVisit}
            onNewVisit={handleNewVisit}
          />
        )}
        {activePage === 'reports' && (
          <ReportsPage />
        )}
      </main>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
