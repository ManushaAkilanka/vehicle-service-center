import { useState, useEffect, useRef } from 'react';

/**
 * Dropdown with checkboxes for assigning multiple employees to a line item.
 * Closes when clicking outside.
 */
export default function EmployeeMultiSelect({ employees, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggle(emp) {
    const already = selected.some(s => s.id === emp.id);
    onChange(already ? selected.filter(s => s.id !== emp.id) : [...selected, emp]);
  }

  const label = selected.length === 0
    ? 'Assign employees…'
    : `${selected.length} employee${selected.length > 1 ? 's' : ''} assigned`;

  return (
    <div className="emp-dropdown-wrap" ref={wrapRef}>
      {/* Trigger */}
      <div
        className={`emp-dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: selected.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="emp-dropdown-menu" role="listbox">
          {employees.length === 0 && (
            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
              No active employees found
            </div>
          )}
          {employees.map(emp => {
            const checked = selected.some(s => s.id === emp.id);
            return (
              <label key={emp.id} className="emp-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(emp)}
                />
                <div>
                  <div className="emp-option-name">{emp.full_name}</div>
                  <div className="emp-option-role">{emp.role}</div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="emp-chips">
          {selected.map(emp => (
            <span key={emp.id} className="emp-chip">
              {emp.full_name.split(' ')[0]}
              <button
                className="emp-chip-remove"
                onClick={e => { e.stopPropagation(); toggle(emp); }}
                aria-label={`Remove ${emp.full_name}`}
              >✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
