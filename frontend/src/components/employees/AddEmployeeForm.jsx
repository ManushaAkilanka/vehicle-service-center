import { useState } from 'react';
import { createEmployee } from '../../api/employees';

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

const EMPTY_FORM = {
  full_name: '',
  role: 'Mechanic',
  phone: '',
  active: true,
};

export default function AddEmployeeForm({ onClose, onCreated }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

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
      setError('Role / position is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await createEmployee(form);
      setForm(EMPTY_FORM);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel" id="add-employee-panel" style={{ animation: 'slideUp 0.25s ease' }}>
      <div className="form-panel-header">
        <span className="form-panel-title">👥 Add New Employee</span>
        <button className="btn-close" onClick={onClose} aria-label="Close form">✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group full">
            <label htmlFor="add-emp-name">Full Name *</label>
            <input
              id="add-emp-name"
              name="full_name"
              type="text"
              required
              placeholder="e.g. Kasun Fernando"
              value={form.full_name}
              onChange={handleChange}
            />
          </div>

          {/* Role / Position */}
          <div className="form-group">
            <label htmlFor="add-emp-role">Role / Position *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="add-emp-role"
                name="role"
                type="text"
                required
                placeholder="e.g. Mechanic"
                value={form.role}
                onChange={handleChange}
                list="role-options"
                style={{ flex: 1 }}
              />
              <datalist id="role-options">
                {ROLE_SUGGESTIONS.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="add-emp-phone">Phone Number *</label>
            <input
              id="add-emp-phone"
              name="phone"
              type="tel"
              required
              placeholder="e.g. 077 123 4567"
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
                Active (Available for service assignment)
              </span>
            </label>
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginTop: 16 }}>⚠️ {error}</div>}

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            id="submit-add-employee-btn"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ borderTopColor: '#000' }} /> Adding…</>
            ) : (
              '✓ Save Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
