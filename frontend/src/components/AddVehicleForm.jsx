import { useState, useMemo } from 'react';
import { createVehicle } from '../api/vehicles';
import {
  getMakesForType,
  getModelsForMake,
  normalizeMakeName,
} from '../utils/vehicleData';

const VEHICLE_TYPES = ['Car', 'Bike', 'Three Wheeler', 'Van', 'SUV', 'Other'];

const EMPTY_FORM = {
  number_plate: '',
  vehicle_type: '',
  make:         '',
  model:        '',
  owner_name:   '',
  owner_phone:  '',
};

export default function AddVehicleForm({ onClose, onCreated }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Make suggestions filtered by vehicle type (case-insensitively deduplicated & normalized to proper case)
  const makeSuggestions = useMemo(() => {
    return getMakesForType(form.vehicle_type);
  }, [form.vehicle_type]);

  // Model suggestions filtered by make and vehicle type
  const modelSuggestions = useMemo(() => {
    return getModelsForMake(form.make, form.vehicle_type);
  }, [form.make, form.vehicle_type]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = {
        ...prev,
        [name]: name === 'number_plate' ? value.toUpperCase() : value,
      };
      // When vehicle type changes, if current make doesn't belong to new type, keep or normalize
      if (name === 'vehicle_type' && prev.make) {
        next.make = normalizeMakeName(prev.make, value);
      }
      return next;
    });
  }

  function handleMakeBlur() {
    if (form.make) {
      setForm(prev => ({
        ...prev,
        make: normalizeMakeName(prev.make, prev.vehicle_type),
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Ensure make is saved in proper case (e.g. 'Bajaj' instead of 'bajaj')
      const payload = {
        ...form,
        make: normalizeMakeName(form.make, form.vehicle_type),
      };
      const created = await createVehicle(payload);
      setForm(EMPTY_FORM);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-panel" id="add-vehicle-panel">
      <div className="form-panel-header">
        <span className="form-panel-title">🚗 Register New Vehicle</span>
        <button className="btn-close" onClick={onClose} aria-label="Close form">✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Number Plate — full row */}
          <div className="form-group full">
            <label htmlFor="add-plate">Number Plate</label>
            <input
              id="add-plate"
              name="number_plate"
              className="plate-style"
              value={form.number_plate}
              onChange={handleChange}
              placeholder="e.g. WP CAA-1234 or TI-6774"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>

          {/* Vehicle Type */}
          <div className="form-group">
            <label htmlFor="add-vehicle-type">Vehicle Type</label>
            <select
              id="add-vehicle-type"
              name="vehicle_type"
              value={form.vehicle_type}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select type…</option>
              {VEHICLE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Make — suggestions filtered by vehicle type, deduplicated & proper-cased */}
          <div className="form-group">
            <label htmlFor="add-make">Make</label>
            <input
              id="add-make"
              name="make"
              list="add-make-suggestions"
              value={form.make}
              onChange={handleChange}
              onBlur={handleMakeBlur}
              placeholder={
                form.vehicle_type === 'Bike'
                  ? 'e.g. Bajaj, Honda, TVS'
                  : form.vehicle_type === 'Three Wheeler'
                  ? 'e.g. Bajaj, TVS, Piaggio'
                  : 'e.g. Toyota, Suzuki, Honda'
              }
              autoComplete="off"
              required
            />
            <datalist id="add-make-suggestions">
              {makeSuggestions.map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* Model — dynamic suggestions based on make */}
          <div className="form-group">
            <label htmlFor="add-model">Model</label>
            <input
              id="add-model"
              name="model"
              list="add-model-suggestions"
              value={form.model}
              onChange={handleChange}
              placeholder={
                modelSuggestions.length > 0
                  ? `e.g. ${modelSuggestions.slice(0, 3).join(', ')}`
                  : form.vehicle_type === 'Bike'
                  ? 'e.g. Pulsar, Dio, Apache'
                  : form.vehicle_type === 'Three Wheeler'
                  ? 'e.g. RE, Maxima, King'
                  : 'e.g. Aqua, Alto, Vezel'
              }
              autoComplete="off"
              required
            />
            <datalist id="add-model-suggestions">
              {modelSuggestions.map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* Owner Name */}
          <div className="form-group">
            <label htmlFor="add-owner-name">Owner Name</label>
            <input
              id="add-owner-name"
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="add-owner-phone">Phone Number</label>
            <input
              id="add-owner-phone"
              name="owner_phone"
              value={form.owner_phone}
              onChange={handleChange}
              placeholder="077 123 4567"
              type="tel"
              required
            />
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ margin: '0 24px 16px' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="form-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            id="add-vehicle-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Registering…</> : '✅ Register Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
