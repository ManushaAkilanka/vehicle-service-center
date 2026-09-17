import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEmployees, deleteEmployee } from '../api/employees';
import AddEmployeeForm   from '../components/employees/AddEmployeeForm';
import EditEmployeeModal from '../components/employees/EditEmployeeModal';

export default function EmployeesPage({ onToast }) {
  const [employees,        setEmployees]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [search,           setSearch]           = useState('');
  const [statusFilter,     setStatusFilter]     = useState('All'); // 'All' | 'Active' | 'Inactive'
  const [showAddForm,      setShowAddForm]      = useState(false);
  const [editingEmployee,  setEditingEmployee]  = useState(null);
  const [deletingId,       setDeletingId]       = useState(null);

  // ── Load all employees (including inactive) ─────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEmployees({ all: true });
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ── Filter by search & status ────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(emp => {
      // Status filter
      if (statusFilter === 'Active' && !emp.active) return false;
      if (statusFilter === 'Inactive' && emp.active) return false;

      // Query filter
      if (!q) return true;
      return (
        emp.full_name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q)
      );
    });
  }, [employees, search, statusFilter]);

  // ── Counts ───────────────────────────────────────────────────────────
  const activeCount   = employees.filter(e => e.active).length;
  const inactiveCount = employees.length - activeCount;

  // ── Handlers ─────────────────────────────────────────────────────────
  function handleCreated(created) {
    setEmployees(prev => [created, ...prev.filter(e => e.id !== created.id)]);
    setShowAddForm(false);
    onToast?.(`✅ Employee "${created.full_name}" added successfully`);
  }

  function handleSaved(updated) {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingEmployee(null);
    onToast?.(`✅ Employee "${updated.full_name}" updated successfully`);
  }

  async function handleDelete(emp) {
    const confirmText = emp.active
      ? `Are you sure you want to remove or deactivate "${emp.full_name}"?`
      : `Delete record for "${emp.full_name}"?`;

    if (!window.confirm(confirmText)) return;

    setDeletingId(emp.id);
    try {
      const res = await deleteEmployee(emp.id);
      if (res.data?.deactivated) {
        // Soft-deactivated
        setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: 0 } : e));
        onToast?.(`ℹ️ ${res.message}`);
      } else {
        // Hard deleted
        setEmployees(prev => prev.filter(e => e.id !== emp.id));
        onToast?.(`🗑️ ${res.message}`);
      }
    } catch (err) {
      alert('Failed to delete employee: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="employees-page" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="services-page-header" style={{ marginBottom: 24 }}>
        <div className="services-page-title">
          <h1>👥 <span>Employees</span> Management</h1>
          <p>Manage staff, technicians, and advisors for service line assignments</p>
        </div>
        <div className="services-page-actions">
          {!showAddForm && (
            <button
              id="add-employee-btn"
              className="btn-primary"
              style={{ height: 44, padding: '0 20px', fontSize: 14 }}
              onClick={() => setShowAddForm(true)}
            >
              ＋ Add New Employee
            </button>
          )}
        </div>
      </div>

      {/* ── Add Form Panel ──────────────────────────────────────────── */}
      {showAddForm && (
        <div style={{ marginBottom: 32 }}>
          <AddEmployeeForm
            onClose={() => setShowAddForm(false)}
            onCreated={handleCreated}
          />
        </div>
      )}

      {/* ── Search & Filter Tabs ────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Status tabs */}
        <div className="vehicle-filter-tabs" style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'All',      label: 'All Staff', icon: '👥', count: employees.length },
            { id: 'Active',   label: 'Active',    icon: '🟢', count: activeCount },
            { id: 'Inactive', label: 'Inactive',  icon: '⚪', count: inactiveCount },
          ].map(tab => (
            <button
              key={tab.id}
              id={`emp-filter-${tab.id.toLowerCase()}`}
              className={`filter-tab-btn${statusFilter === tab.id ? ' active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${statusFilter === tab.id ? 'var(--amber)' : 'var(--border)'}`,
                background: statusFilter === tab.id ? 'rgba(245,166,35,.12)' : 'var(--bg-card)',
                color: statusFilter === tab.id ? 'var(--amber)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all var(--tx-fast)',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                background: statusFilter === tab.id ? 'var(--amber)' : 'var(--bg-card-alt)',
                color: statusFilter === tab.id ? '#000' : 'var(--text-muted)',
                borderRadius: 99,
                fontSize: 11,
                padding: '1px 7px',
                fontWeight: 800,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ flex: '1', minWidth: 240, maxWidth: 360 }}>
          <input
            id="emp-search-input"
            type="search"
            placeholder="🔍 Search by name, role, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 42,
              padding: '0 14px',
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && <div className="error-banner" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

      {/* ── Loading Skeleton ────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {!loading && filteredEmployees.length === 0 && (
        <div className="help-state" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div className="help-icon" style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
          <h3 style={{ fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>No employees found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {search ? `No staff matching "${search}"` : 'Get started by adding your first employee.'}
          </p>
          {!showAddForm && (
            <button
              className="btn-primary"
              style={{ marginTop: 16, height: 40, fontSize: 13 }}
              onClick={() => setShowAddForm(true)}
            >
              ＋ Add Employee
            </button>
          )}
        </div>
      )}

      {/* ── Employees Cards Grid ─────────────────────────────────────── */}
      {!loading && filteredEmployees.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {filteredEmployees.map(emp => {
            const initials = emp.full_name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={emp.id}
                className="employee-card"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${emp.active ? 'var(--border)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative',
                  opacity: emp.active ? 1 : 0.65,
                  transition: 'border-color var(--tx-fast), transform var(--tx-fast)',
                }}
              >
                {/* Header row: Avatar + Name + Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 99,
                    background: emp.active ? 'rgba(245,166,35,.15)' : 'var(--bg-card-alt)',
                    border: `1.5px solid ${emp.active ? 'var(--amber)' : 'var(--border)'}`,
                    color: emp.active ? 'var(--amber)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {emp.full_name}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--amber)',
                      fontWeight: 600,
                      marginTop: 2,
                    }}>
                      {emp.role}
                    </div>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    background: emp.active ? 'rgba(34,197,94,.15)' : 'rgba(148,163,184,.12)',
                    color: emp.active ? 'var(--green, #22c55e)' : 'var(--text-muted)',
                    border: `1px solid ${emp.active ? 'rgba(34,197,94,.3)' : 'var(--border)'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {emp.active ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                {/* Details row: Phone */}
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--bg-page)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ fontSize: 14 }}>📞</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{emp.phone}</span>
                </div>

                {/* Actions footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 'auto',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border)',
                }}>
                  <button
                    className="btn-icon"
                    onClick={() => setEditingEmployee(emp)}
                    title="Edit employee"
                    aria-label={`Edit ${emp.full_name}`}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(emp)}
                    disabled={deletingId === emp.id}
                    title={emp.active ? 'Deactivate / delete employee' : 'Delete record'}
                    aria-label={`Delete ${emp.full_name}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
