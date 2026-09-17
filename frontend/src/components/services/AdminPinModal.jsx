import { useState, useRef, useEffect } from 'react';

// Default admin PIN — in production set VITE_ADMIN_PIN in the frontend .env
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

export default function AdminPinModal({ onClose, onSuccess }) {
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
      inputRef.current?.focus();
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pin-modal">
        <div className="form-panel">
          <div className="form-panel-header">
            <span className="form-panel-title">🔐 Admin Access</span>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pin-input-row">
              <input
                ref={inputRef}
                id="admin-pin-input"
                className="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={e => { setPin(e.target.value); setError(''); }}
                placeholder="••••"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="error-banner" style={{ margin: '0 24px 16px' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button
                id="admin-pin-submit"
                type="submit"
                className="btn-primary"
                disabled={!pin}
              >
                🔓 Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
