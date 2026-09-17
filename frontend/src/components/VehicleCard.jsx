function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function VehicleCard({ vehicle, onEdit, onStartVisit }) {
  const { serviced_before, last_service_date } = vehicle;

  return (
    <div className="vehicle-card" id="vehicle-result-card">
      {/* ── Header: plate + actions ─────────────────────── */}
      <div className="card-header">
        <span className="card-plate">{vehicle.number_plate}</span>
        <div className="card-actions">
          {onStartVisit && (
            <button
              id="start-visit-btn"
              className="btn-primary"
              style={{ height: 40, fontSize: 13 }}
              onClick={() => onStartVisit(vehicle)}
            >
              🔧 Start New Visit
            </button>
          )}
          <button
            id="edit-vehicle-btn"
            className="btn-edit"
            onClick={() => onEdit(vehicle)}
          >
            ✏️ Edit Details
          </button>
        </div>
      </div>

      {/* ── Body: vehicle details grid ──────────────────── */}
      <div className="card-body">
        <div className="info-group">
          <label>Owner</label>
          <span>{vehicle.owner_name}</span>
        </div>
        <div className="info-group">
          <label>Phone</label>
          <span>{vehicle.owner_phone}</span>
        </div>
        <div className="info-group">
          <label>Vehicle Type</label>
          <span>{vehicle.vehicle_type}</span>
        </div>
        <div className="info-group">
          <label>Make</label>
          <span>{vehicle.make}</span>
        </div>
        <div className="info-group">
          <label>Model</label>
          <span>{vehicle.model}</span>
        </div>
        <div className="info-group">
          <label>Registered</label>
          <span>{fmt(vehicle.created_at)}</span>
        </div>
      </div>

      {/* ── Footer: service status ──────────────────────── */}
      <div className="card-footer">
        {serviced_before ? (
          <span className="service-badge serviced">
            <span className="dot" /> Returning Customer
          </span>
        ) : (
          <span className="service-badge new-customer">
            <span className="dot" /> First Visit
          </span>
        )}

        {serviced_before && last_service_date && (
          <span className="last-service">
            Last service: <strong>{fmt(last_service_date)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
