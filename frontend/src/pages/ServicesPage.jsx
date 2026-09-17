import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchServices } from '../api/services';
import ServiceCard      from '../components/services/ServiceCard';
import AddServiceForm   from '../components/services/AddServiceForm';
import EditServiceModal from '../components/services/EditServiceModal';
import AdminPinModal    from '../components/services/AdminPinModal';

const VEHICLE_FILTER_TABS = [
  { id: 'All',           label: 'All Vehicles',   icon: '📋' },
  { id: 'Bike',          label: 'Bike',           icon: '🏍️' },
  { id: 'Car',           label: 'Car',            icon: '🚗' },
  { id: 'Three Wheeler', label: 'Three Wheeler',  icon: '🛺' },
];

export default function ServicesPage({ onToast }) {
  const [services,            setServices]            = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');

  const [isAdmin,             setIsAdmin]             = useState(true);
  const [showPinModal,        setShowPinModal]        = useState(false);
  const [showAddForm,         setShowAddForm]         = useState(false);
  const [editingService,      setEditingService]      = useState(null);

  // ── Load services ─────────────────────────────────────────
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchServices();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  // ── Filter by selected vehicle type tab ───────────────────
  const filteredServices = useMemo(() => {
    if (selectedVehicleType === 'All') return services;
    return services.filter(s => s.vehicle_type === selectedVehicleType);
  }, [services, selectedVehicleType]);

  // ── Counts for tabs ───────────────────────────────────────
  const counts = useMemo(() => {
    const map = { All: services.length, Bike: 0, Car: 0, 'Three Wheeler': 0 };
    services.forEach(s => {
      if (map[s.vehicle_type] !== undefined) map[s.vehicle_type]++;
    });
    return map;
  }, [services]);

  // ── Group by category ─────────────────────────────────────
  const grouped = useMemo(() => {
    return filteredServices.reduce((acc, svc) => {
      const key = svc.category || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(svc);
      return acc;
    }, {});
  }, [filteredServices]);

  const categories = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // ── Handlers ──────────────────────────────────────────────
  function handleUpdated(updated) {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingService(null);
    onToast('✅ Service updated successfully');
  }

  function handleDeactivated(id) {
    setServices(prev => prev.filter(s => s.id !== id));
  }

  function handleCreated(newService) {
    setServices(prev => [...prev, newService].sort((a, b) =>
      (a.vehicle_type || '').localeCompare(b.vehicle_type || '') ||
      (a.category || '').localeCompare(b.category || '') ||
      a.name.localeCompare(b.name)
    ));
    setShowAddForm(false);
    onToast('✅ Service added to catalog');
  }

  function handleAdminUnlock() {
    setIsAdmin(true);
    setShowPinModal(false);
    onToast('🔓 Admin mode active');
  }

  function handleAdminLock() {
    setIsAdmin(false);
    setShowAddForm(false);
    setEditingService(null);
    onToast('🔒 Admin mode disabled');
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Page header */}
      <div className="services-page-header">
        <div className="services-page-title">
          <h1>Service <span>Catalog</span></h1>
          <p>
            {services.length} active service{services.length !== 1 ? 's' : ''} in master catalog
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              * All prices are starting/approximate labor estimates and fully editable by admin.
            </span>
          </p>
        </div>

        <div className="services-page-actions">
          {/* Admin toggle */}
          <div className="admin-toggle">
            {isAdmin ? (
              <>
                <span className="admin-badge">
                  <span className="dot" /> Admin Mode
                </span>
                <button className="btn-admin-lock" onClick={handleAdminLock} title="Lock Admin Mode">
                  🔒 Lock
                </button>
              </>
            ) : (
              <button
                id="admin-unlock-btn"
                className="btn-admin-lock"
                onClick={() => setShowPinModal(true)}
              >
                🔐 Admin
              </button>
            )}
          </div>

          {/* Add service */}
          <button
            id="add-service-btn"
            className="btn-primary"
            style={{ height: 44 }}
            onClick={() => {
              if (!isAdmin) {
                setShowPinModal(true);
              } else {
                setShowAddForm(v => !v);
              }
            }}
          >
            {showAddForm ? '✕ Cancel' : '＋ Add Service'}
          </button>
        </div>
      </div>

      {/* Vehicle Type Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {VEHICLE_FILTER_TABS.map(tab => {
          const isActive = selectedVehicleType === tab.id;
          const count = counts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedVehicleType(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: isActive ? 'var(--amber)' : 'var(--bg-card)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--amber)' : 'var(--border)'}`,
                fontWeight: isActive ? 800 : 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: isActive ? 'rgba(0,0,0,0.18)' : 'var(--bg-card-alt)',
                  color: isActive ? '#000' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add service form */}
      {showAddForm && isAdmin && (
        <>
          <AddServiceForm
            defaultVehicleType={selectedVehicleType !== 'All' ? selectedVehicleType : 'Car'}
            onClose={() => setShowAddForm(false)}
            onCreated={handleCreated}
          />
          <div className="section-divider" style={{ marginTop: 36 }}>All Catalog Services</div>
        </>
      )}

      {/* Error state */}
      {error && (
        <div className="error-banner" style={{ marginBottom: 20 }}>
          ⚠️ {error}
          <button
            onClick={loadServices}
            style={{ marginLeft: 'auto', background: 'none', border: 'none',
                     color: 'var(--amber)', fontWeight: 700, cursor: 'pointer' }}
          >
            Retry →
          </button>
        </div>
      )}

      {/* Skeleton loaders */}
      {loading && (
        <div className="services-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {/* Catalog grid grouped by category */}
      {!loading && categories.length === 0 && !error && (
        <div className="services-grid">
          <div className="empty-catalog">
            <div className="empty-icon">⚙️</div>
            <p>No {selectedVehicleType !== 'All' ? selectedVehicleType : ''} services in the catalog yet.<br />
              Click "＋ Add Service" above to add one.
            </p>
          </div>
        </div>
      )}

      {!loading && categories.map(cat => (
        <div className="category-group" key={cat}>
          <div className="category-label">
            <span className="category-pill">{cat}</span>
            <span className="category-count">{grouped[cat].length} service{grouped[cat].length !== 1 ? 's' : ''}</span>
          </div>
          <div className="services-grid">
            {grouped[cat].map(svc => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isAdmin={isAdmin}
                onEdit={setEditingService}
                onDeactivated={handleDeactivated}
                onToast={onToast}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Edit Service Modal */}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={handleUpdated}
        />
      )}

      {/* Admin PIN modal */}
      {showPinModal && (
        <AdminPinModal
          onClose={() => setShowPinModal(false)}
          onSuccess={handleAdminUnlock}
        />
      )}
    </>
  );
}
