import { useState, useEffect } from 'react';
import { updateEmployee } from '../../api/employees';

const ROLE_SUGGESTIONS = [
  'Mechanic',
  'Lead Mechanic',
  'Service Advisor',
  'Technician',
  'Electrician',
  'Washer / Cleaner',
  'Supervisor',
  'Storekeeper',
];

export default function EditEmployeeModal({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    role: '',
    phone: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (employee) {
      setForm({
        full_name: employee.full_name || '',
        role:      employee.role || '',
        phone:     employee.phone || '',
        active:    Boolean(employee.active),
      });
      setError('');
    }
  }, [employee]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Employee name is required');
      return;
    }
    if (!form.role.trim()) {
      setError('Role is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updated = await updateEmployee(employee.id, form);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!employee) return null;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="form-panel">
          <div className="form-panel-header">
            <span className="form-panel-title">✏️ Edit Employee — {employee.full_name}</span>
            <button id="edit-employee-modal-close" className="btn-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group full">
                <label htmlFor="edit-emp-name">Full Name *</label>
                <input
                  id="edit-emp-name"
                  name="full_name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label htmlFor="edit-emp-role">Role / Position *</label>
                <input
                  id="edit-emp-role"
                  name="role"
                  type="text"
                  required
                  value={form.role}
                  onChange={handleChange}
                  list="edit-role-options"
                />
                <datalist id="edit-role-options">
                  {ROLE_SUGGESTIONS.map(r => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="edit-emp-phone">Phone Number *</label>
                <input
                  id="edit-emp-phone"
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Active Status */}
              <div className="form-group full" style={{ marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: 'var(--amber)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                    Active Status (Available for service assignment)
                  </span>
                </label>
              </div>
            </div>

            {error && <div className="error-banner" style={{ marginTop: 16 }}>⚠️ {error}</div>}

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                id="save-edit-employee-btn"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ borderTopColor: '#000' }} /> Saving…</>
                ) : (
                  '✓ Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
