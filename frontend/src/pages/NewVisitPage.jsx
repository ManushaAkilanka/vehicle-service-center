import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchServices }    from '../api/services';
import { fetchEmployees }   from '../api/employees';
import { lookupVehicle }    from '../api/vehicles';
import { uploadVisitPhoto, createVisit } from '../api/visits';
import { fmtLKR }           from '../utils/currency';

import ServiceLineItem  from '../components/visits/ServiceLineItem';
import PhotoCapture     from '../components/visits/PhotoCapture';
import VisitReceipt     from '../components/visits/VisitReceipt';

// Unique local IDs for line items (not sent to server)
let _localId = 0;
function newLocalId() { return ++_localId; }

function makeEmptyItem() {
  return { localId: newLocalId(), service: null, assignedEmployees: [] };
}

/**
 * Normalizes vehicle type strings to master catalog types: 'Bike', 'Car', or 'Three Wheeler'.
 */
export function normalizeVehicleType(type) {
  if (!type) return '';
  const t = type.trim().toLowerCase();
  if (t === 'bike' || t === 'motorcycle') return 'Bike';
  if (t === 'three wheeler' || t === 'auto rickshaw' || t === 'tuk tuk' || t === 'tuktuk') return 'Three Wheeler';
  if (t === 'car' || t === 'suv' || t === 'van' || t === 'truck' || t === 'bus') return 'Car';
  return type.trim();
}

export default function NewVisitPage({ preselectedVehicle, onToast, onPayment }) {
  // ── Data ──────────────────────────────────────────────────
  const [services,   setServices]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [dataReady,  setDataReady]  = useState(false);

  // ── Vehicle ───────────────────────────────────────────────
  const [vehicle,    setVehicle]    = useState(preselectedVehicle || null);
  const [plateDraft, setPlateDraft] = useState('');
  const [searching,  setSearching]  = useState(false);
  const [searchErr,  setSearchErr]  = useState('');

  // ── Line items ────────────────────────────────────────────
  const [lineItems,  setLineItems]  = useState([makeEmptyItem()]);

  // ── Photo ─────────────────────────────────────────────────
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [serverPhotoUrl, setServerPhotoUrl] = useState(''); // confirmed URL from server

  // ── Submission ────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');
  const [visitResult, setVisitResult] = useState(null);  // set on success

  // ── Load catalog + employees once ─────────────────────────
  useEffect(() => {
    Promise.all([fetchServices(), fetchEmployees()])
      .then(([svcs, emps]) => {
        setServices(svcs);
        setEmployees(emps);
        setDataReady(true);
      })
      .catch(err => onToast('⚠️ ' + err.message));
  }, []);

  // ── Vehicle type filtering ────────────────────────────────
  const effectiveVehicleType = useMemo(() => {
    return vehicle ? normalizeVehicleType(vehicle.vehicle_type) : null;
  }, [vehicle]);

  const filteredServices = useMemo(() => {
    if (!effectiveVehicleType) return services;
    return services.filter(s => s.vehicle_type === effectiveVehicleType);
  }, [services, effectiveVehicleType]);

  function handleSetVehicle(newVehicle) {
    setVehicle(newVehicle);
    if (newVehicle) {
      const targetType = normalizeVehicleType(newVehicle.vehicle_type);
      setLineItems(prev => prev.map(item => {
        if (item.service && item.service.vehicle_type !== targetType) {
          return { ...item, service: null, assignedEmployees: [] };
        }
        return item;
      }));
    }
  }

  // ── Vehicle search ────────────────────────────────────────
  async function handleVehicleSearch(e) {
    e.preventDefault();
    if (!plateDraft.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      const v = await lookupVehicle(plateDraft.trim().toUpperCase());
      handleSetVehicle(v);
    } catch (err) {
      setSearchErr(err.message);
    } finally {
      setSearching(false);
    }
  }

  // ── Line item management ──────────────────────────────────
  function addLineItem() { setLineItems(prev => [...prev, makeEmptyItem()]); }

  function removeLineItem(localId) {
    setLineItems(prev => prev.length === 1 ? prev : prev.filter(i => i.localId !== localId));
  }

  function updateLineItem(localId, patch) {
    setLineItems(prev => prev.map(i => i.localId === localId ? { ...i, ...patch } : i));
  }

  // ── Running total ──────────────────────────────────────────
  const total = lineItems.reduce((sum, item) => {
    return sum + (item.service ? parseFloat(item.service.current_price) : 0);
  }, 0);

  // ── Validation ────────────────────────────────────────────
  function validate() {
    if (!vehicle) return 'Please select a vehicle first';
    for (const item of lineItems) {
      if (!item.service) return 'Please select a service for each line item';
      if (!item.assignedEmployees.length) return `Please assign at least one employee to "${item.service.name}"`;
    }
    return null;
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validate();
    if (err) { onToast('⚠️ ' + err); return; }

    setSubmitting(true);
    setSubmitErr('');

    try {
      // 1. Upload photo first so we get the server-confirmed path
      let photo_path = null;
      if (photoFile) {
        setPhotoUploading(true);
        try {
          const uploaded = await uploadVisitPhoto(photoFile);
          photo_path = uploaded.path;
          setServerPhotoUrl(uploaded.url);
        } finally {
          setPhotoUploading(false);
        }
      }

      // 2. Create the visit (transactional on backend)
      const payload = {
        vehicle_id: vehicle.id,
        services: lineItems.map(item => ({
          service_id:   item.service.id,
          employee_ids: item.assignedEmployees.map(e => e.id),
        })),
        photo_path,
      };

      const visit = await createVisit(payload);
      setVisitResult(visit);
      onToast('✅ Visit created successfully');

    } catch (err) {
      setSubmitErr(err.message);
      onToast('❌ ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reset for new visit ───────────────────────────────────
  function handleNewVisit() {
    handleSetVehicle(preselectedVehicle || null);
    setPlateDraft('');
    setLineItems([makeEmptyItem()]);
    setPhotoFile(null);
    setPhotoPreview('');
    setServerPhotoUrl('');
    setVisitResult(null);
    setSubmitErr('');
  }

  // ── If visit was created → show receipt ──────────────────
  if (visitResult) {
    return (
      <VisitReceipt
        visit={visitResult}
        onNewVisit={handleNewVisit}
        onPayment={onPayment}
      />
    );
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div className="visit-page">

      {/* ── Vehicle ──────────────────────────────────────── */}
      <div className="visit-section">
        <div className="visit-section-header">
          <span className="visit-section-title">🚗 Vehicle</span>
          {vehicle && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--amber)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => { handleSetVehicle(null); setPlateDraft(''); setSearchErr(''); }}
            >
              Change →
            </button>
          )}
        </div>

        <div className="visit-section-body">
          {vehicle ? (
            /* Vehicle confirmed */
            <div className="visit-vehicle-banner" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="visit-vehicle-info">
                <span className="visit-vehicle-plate">{vehicle.number_plate}</span>
                <div className="visit-vehicle-details">
                  <div className="visit-vehicle-name">{vehicle.owner_name}</div>
                  <div className="visit-vehicle-meta">
                    {vehicle.make} {vehicle.model} · <strong style={{ color: 'var(--amber)' }}>{vehicle.vehicle_type}</strong> {effectiveVehicleType !== vehicle.vehicle_type && `(${effectiveVehicleType})`} · {vehicle.owner_phone}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Search for vehicle */
            <form className="visit-vehicle-search" onSubmit={handleVehicleSearch}>
              <input
                id="visit-plate-input"
                className="plate-input"
                value={plateDraft}
                onChange={e => setPlateDraft(e.target.value.toUpperCase())}
                placeholder="Enter plate…"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                style={{ maxWidth: 280, height: 52, fontSize: 20 }}
              />
              <button
                type="submit"
                className="search-btn"
                disabled={searching || !plateDraft.trim()}
                style={{ height: 52, fontSize: 15, padding: '0 20px' }}
              >
                {searching ? <><span className="spinner" /> Searching…</> : '🔍 Find Vehicle'}
              </button>
            </form>
          )}
          {searchErr && <div className="error-banner">⚠️ {searchErr}</div>}
        </div>
      </div>

      {/* ── Services ─────────────────────────────────────── */}
      <div className="visit-section">
        <div className="visit-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="visit-section-title">⚙️ Services Performed</span>
            {vehicle && (
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'var(--bg-card-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--amber)',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                }}
              >
                Showing {effectiveVehicleType} Services ({filteredServices.length})
              </span>
            )}
          </div>
          <button className="btn-primary" style={{ height: 38, fontSize: 13 }} onClick={addLineItem}>
            ＋ Add Service
          </button>
        </div>
        <div className="visit-section-body">
          {!dataReady ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading catalog…</div>
          ) : (
            lineItems.map((item, idx) => (
              <ServiceLineItem
                key={item.localId}
                item={item}
                index={idx}
                services={filteredServices}
                employees={employees}
                hasVehicle={Boolean(vehicle)}
                onChange={updateLineItem}
                onRemove={removeLineItem}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Photo ────────────────────────────────────────── */}
      <div className="visit-section">
        <div className="visit-section-header">
          <span className="visit-section-title">📷 Vehicle Photo <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></span>
        </div>
        <div className="visit-section-body">
          <PhotoCapture
            file={photoFile}
            preview={serverPhotoUrl || photoPreview}
            uploading={photoUploading}
            onCapture={(f, url) => { setPhotoFile(f); setPhotoPreview(url); setServerPhotoUrl(''); }}
            onClear={() => { setPhotoFile(null); setPhotoPreview(''); setServerPhotoUrl(''); }}
          />
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────── */}
      {submitErr && <div className="error-banner">❌ {submitErr}</div>}

      {/* ── Sticky total + submit bar ─────────────────────── */}
      <div className="visit-total-bar">
        <div>
          <div className="total-label">Running Total</div>
          <div className="total-amount" id="running-total-display">{fmtLKR(total)}</div>
        </div>
        <button
          id="create-visit-btn"
          className="btn-create-visit"
          onClick={handleSubmit}
          disabled={submitting || !vehicle || total === 0}
        >
          {submitting
            ? <><span className="spinner" style={{ borderTopColor: '#000' }} /> Creating…</>
            : '✅ Create Visit & Proceed to Payment'}
        </button>
      </div>
    </div>
  );
}
