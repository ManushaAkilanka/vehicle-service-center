import EmployeeMultiSelect from './EmployeeMultiSelect';
import { fmtLKR } from '../../utils/currency';

/**
 * One service line item: service picker + employee assignment + price.
 *
 * @param {object}   item        — { localId, service: null|{id,name,current_price}, employees: [] }
 * @param {Array}    services    — filtered catalog for the selected vehicle type
 * @param {Array}    employees   — staff roster
 * @param {boolean}  hasVehicle  — whether a vehicle is currently selected
 * @param {Function} onChange    — (localId, patch) => void
 * @param {Function} onRemove    — (localId) => void
 * @param {number}   index       — display index
 */
export default function ServiceLineItem({ item, services, employees, hasVehicle = true, onChange, onRemove, index }) {
  function handleServiceChange(e) {
    const svc = services.find(s => s.id === e.target.value) || null;
    onChange(item.localId, { service: svc, assignedEmployees: [] });
  }

  function handleEmployeesChange(newEmps) {
    onChange(item.localId, { assignedEmployees: newEmps });
  }

  const price = item.service ? parseFloat(item.service.current_price) : null;

  return (
    <div className="line-item">
      <button
        className="line-item-remove"
        onClick={() => onRemove(item.localId)}
        aria-label="Remove service"
        title="Remove"
      >✕</button>

      {/* Row label */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', letterSpacing: '.5px' }}>
        SERVICE #{index + 1}
      </div>

      {/* Service picker */}
      <div>
        <div className="line-item-label">Service</div>
        <div className="line-item-row">
          <select
            className="service-select"
            value={item.service?.id || ''}
            onChange={handleServiceChange}
            disabled={!hasVehicle}
          >
            <option value="" disabled>
              {!hasVehicle
                ? '⚠️ Please select a vehicle above first…'
                : services.length === 0
                ? 'No services available for this vehicle type'
                : 'Select a service…'}
            </option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.category} ({fmtLKR(s.current_price)})
              </option>
            ))}
          </select>

          {price !== null && (
            <span className="line-item-price">{fmtLKR(price)}</span>
          )}
        </div>
      </div>

      {/* Employee assignment */}
      <div>
        <div className="line-item-label">Assigned Employees</div>
        <EmployeeMultiSelect
          employees={employees}
          selected={item.assignedEmployees}
          onChange={handleEmployeesChange}
        />
      </div>
    </div>
  );
}
