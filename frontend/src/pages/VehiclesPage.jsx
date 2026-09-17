import { useState, useCallback } from 'react';
import SearchBar      from '../components/SearchBar';
import VehicleCard    from '../components/VehicleCard';
import EditModal      from '../components/EditModal';
import AddVehicleForm from '../components/AddVehicleForm';
import { lookupVehicle } from '../api/vehicles';

export default function VehiclesPage({ onToast, onStartVisit }) {
  const [vehicle,     setVehicle]     = useState(null);
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState('');
  const [editTarget,  setEditTarget]  = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSearch = useCallback(async (plate) => {
    setSearching(true);
    setSearchError('');
    setVehicle(null);
    try {
      const result = await lookupVehicle(plate);
      setVehicle(result);
      setShowAddForm(false);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleEditSaved(updated) {
    setVehicle(updated);
    setEditTarget(null);
    onToast('✅ Vehicle details updated successfully');
  }

  function handleCreated(created) {
    setVehicle(created);
    setShowAddForm(false);
    onToast('✅ Vehicle registered successfully');
  }

  return (
    <>
      {!showAddForm && (
        <>
          <SearchBar onSearch={handleSearch} loading={searching} />

          {searchError && (
            <div className="error-banner">
              ⚠️ {searchError}
              {searchError.toLowerCase().includes('no vehicle') && (
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none',
                           color: '#f5a623', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                  onClick={() => setShowAddForm(true)}
                >
                  Register it →
                </button>
              )}
            </div>
          )}

          {vehicle && (
            <VehicleCard vehicle={vehicle} onEdit={v => setEditTarget(v)} onStartVisit={onStartVisit} />
          )}

          {!vehicle && !searchError && !searching && (
            <div className="help-state">
              <div className="help-icon">🚗</div>
              <p>Enter a number plate above to look up a vehicle</p>
            </div>
          )}
        </>
      )}

      {showAddForm && (
        <>
          <div className="section-divider">Register New Vehicle</div>
          <AddVehicleForm
            onClose={() => setShowAddForm(false)}
            onCreated={handleCreated}
          />
        </>
      )}

      {editTarget && (
        <EditModal
          vehicle={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Add New Vehicle button shown at bottom when not in add mode */}
      {!showAddForm && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            id="add-vehicle-page-btn"
            className="btn-secondary"
            style={{ height: 48 }}
            onClick={() => { setShowAddForm(true); setVehicle(null); setSearchError(''); }}
          >
            ＋ Register New Vehicle
          </button>
        </div>
      )}
    </>
  );
}
