import { useState } from 'react';
import { createService } from '../../api/services';

export const SERVICE_CATEGORIES = [
  'Oil & Lubrication',
  'Filters',
  'Brakes',
  'Drivetrain',
  'Ignition',
  'Fuel System',
  'General Service',
  'Electrical',
  'Tires',
  'AC',
  'Cooling',
  'Detailing',
  'Transmission',
  'Suspension',
  'Other',
];

export const SERVICE_VEHICLE_TYPES = [
  { value: 'Bike', label: '🏍️ Bike' },
  { value: 'Car', label: '🚗 Car' },
  { value: 'Three Wheeler', label: '🛺 Three Wheeler' },
];

const EMPTY = {
  name: '',
  vehicle_type: 'Car',
  category: '',
  description: '',
  current_price: '',
};

export default function AddServiceForm({ onClose, onCreated, defaultVehicleType = 'Car' }) {
  const [form,    setForm]    = useState({ ...EMPTY, vehicle_type: defaultVehicleType });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const created = await createService({
        ...form,
        current_price: parseFloat(form.current_price),
      });
      setForm(EMPTY);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel" id="add-service-panel">
      <div className="form-panel-header">
        <span className="form-panel-title">⚙️ Add New Service</span>
        <button className="btn-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Name — full row */}
          <div className="form-group full">
            <label htmlFor="svc-name">Service Name</label>
            <input
              id="svc-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Engine Oil Change (Mineral 1L)"
              required
            />
          </div>

          {/* Vehicle Type */}
          <div className="form-group">
            <label htmlFor="svc-vehicle-type">Vehicle Type</label>
            <select
              id="svc-vehicle-type"
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
            <label htmlFor="svc-category">Category</label>
            <select
              id="svc-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select category…</option>
              {SERVICE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Price LKR */}
          <div className="form-group">
            <label htmlFor="svc-price">Price (LKR / Rs.)</label>
            <input
              id="svc-price"
              name="current_price"
              type="number"
              min="0"
              step="0.01"
              value={form.current_price}
              onChange={handleChange}
              placeholder="e.g. 1200.00"
              required
            />
          </div>

          {/* Description — full row */}
          <div className="form-group full">
            <label htmlFor="svc-description">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              id="svc-description"
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
            id="add-service-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Adding…</> : '✅ Add Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
