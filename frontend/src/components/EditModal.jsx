import { useState, useEffect, useMemo } from 'react';
import { updateVehicle } from '../api/vehicles';
import {
  getMakesForType,
  getModelsForMake,
  normalizeMakeName,
} from '../utils/vehicleData';

const VEHICLE_TYPES = ['Car', 'Bike', 'Three Wheeler', 'Van', 'SUV', 'Other'];

export default function EditModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState({
    vehicle_type: '',
    make:         '',
    model:        '',
    owner_name:   '',
    owner_phone:  '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Make suggestions filtered by vehicle type
  const makeSuggestions = useMemo(() => {
    return getMakesForType(form.vehicle_type);
  }, [form.vehicle_type]);

  // Model suggestions filtered by make and vehicle type
  const modelSuggestions = useMemo(() => {
    return getModelsForMake(form.make, form.vehicle_type);
  }, [form.make, form.vehicle_type]);

  // Pre-fill form when vehicle prop changes
  useEffect(() => {
    if (vehicle) {
      setForm({
        vehicle_type: vehicle.vehicle_type || '',
        make:         normalizeMakeName(vehicle.make || '', vehicle.vehicle_type),
        model:        vehicle.model        || '',
        owner_name:   vehicle.owner_name   || '',
        owner_phone:  vehicle.owner_phone  || '',
      });
      setError('');
    }
  }, [vehicle]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
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
      const payload = {
        ...form,
        make: normalizeMakeName(form.make, form.vehicle_type),
      };
      const updated = await updateVehicle(vehicle.id, payload);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="form-panel">
          {/* Header */}
          <div className="form-panel-header">
            <span className="form-panel-title">✏️ Edit Vehicle — {vehicle.number_plate}</span>
            <button id="edit-modal-close" className="btn-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Vehicle Type */}
              <div className="form-group">
                <label htmlFor="edit-vehicle-type">Vehicle Type</label>
                <select
                  id="edit-vehicle-type"
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

              {/* Make */}
              <div className="form-group">
                <label htmlFor="edit-make">Make</label>
                <input
                  id="edit-make"
                  name="make"
                  list="edit-make-suggestions"
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
                <datalist id="edit-make-suggestions">
                  {makeSuggestions.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              {/* Model */}
              <div className="form-group">
                <label htmlFor="edit-model">Model</label>
                <input
                  id="edit-model"
                  name="model"
                  list="edit-model-suggestions"
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
                <datalist id="edit-model-suggestions">
                  {modelSuggestions.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              {/* Owner Name */}
              <div className="form-group">
                <label htmlFor="edit-owner-name">Owner Name</label>
                <input
                  id="edit-owner-name"
                  name="owner_name"
                  value={form.owner_name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="edit-owner-phone">Phone</label>
                <input
                  id="edit-owner-phone"
                  name="owner_phone"
                  value={form.owner_phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
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
                id="edit-save-btn"
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
