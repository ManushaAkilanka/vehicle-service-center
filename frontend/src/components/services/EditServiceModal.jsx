import { useState, useEffect } from 'react';
import { updateService } from '../../api/services';
import { SERVICE_CATEGORIES, SERVICE_VEHICLE_TYPES } from './AddServiceForm';

export default function EditServiceModal({ service, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    vehicle_type: 'Car',
    category: '',
    description: '',
    current_price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        vehicle_type: service.vehicle_type || 'Car',
        category: service.category || '',
        description: service.description || '',
        current_price: String(parseFloat(service.current_price || 0)),
      });
      setError('');
    }
  }, [service]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await updateService(service.id, {
        ...form,
        current_price: parseFloat(form.current_price),
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!service) return null;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="form-panel">
          <div className="form-panel-header">
            <span className="form-panel-title">✏️ Edit Service — {service.name}</span>
            <button id="edit-service-modal-close" className="btn-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Name — full row */}
              <div className="form-group full">
                <label htmlFor="edit-svc-name">Service Name</label>
                <input
                  id="edit-svc-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div className="form-group">
                <label htmlFor="edit-svc-vehicle-type">Vehicle Type</label>
                <select
                  id="edit-svc-vehicle-type"
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  required
                >
                  {SERVICE_VEHICLE_TYPES.map(vt => (
                    <option key={vt.value} value={vt.value}>{vt.label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="edit-svc-category">Category</label>
                <select
                  id="edit-svc-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Price LKR */}
              <div className="form-group">
                <label htmlFor="edit-svc-price">Price (LKR / Rs.)</label>
                <input
                  id="edit-svc-price"
                  name="current_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.current_price}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description — full row */}
              <div className="form-group full">
                <label htmlFor="edit-svc-description">
                  Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="edit-svc-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief description of what's included"
                />
              </div>
            </div>

            {error && (
              <div className="error-banner" style={{ margin: '0 24px 16px' }}>⚠️ {error}</div>
            )}

            <div className="form-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button
                id="edit-service-submit-btn"
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
