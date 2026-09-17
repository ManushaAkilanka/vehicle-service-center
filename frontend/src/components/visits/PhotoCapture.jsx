import { useRef, useState, useCallback } from 'react';

/**
 * PhotoCapture
 * ─────────────────────────────────────────────────────────────────────────────
 * Three ways to add a photo:
 *   📷 Take Photo  — triggers the device camera (mobile-first)
 *   📁 Upload File — opens file browser (desktop fallback)
 *   🖱  Drag & Drop — drag an image file onto the drop zone
 *
 * Props:
 *   file       {File|null}    — currently selected File object
 *   preview    {string}       — object URL for preview display
 *   uploading  {boolean}      — true while the file is being uploaded to server
 *   onCapture  (file, url) => void  — called when user picks a file
 *   onClear    ()          => void  — called when user clicks Retake / Remove
 */
export default function PhotoCapture({ file, preview, uploading, onCapture, onClear }) {
  const cameraRef  = useRef(null);
  const fileRef    = useRef(null);
  const [drag, setDrag] = useState(false);

  // ── Handle a file from any source (input or drag) ─────────────────────────
  function processFile(selected) {
    if (!selected) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED_TYPES.includes(selected.type)) {
      alert('Please select a JPEG, PNG, WebP, or HEIC image file.');
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      alert('Image must be smaller than 15 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(selected);
    onCapture(selected, previewUrl);
  }

  function handleInputChange(e) {
    processFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-selecting the same file
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragOver = useCallback(e => { e.preventDefault(); setDrag(true); },  []);
  const handleDragLeave = useCallback(e => { e.preventDefault(); setDrag(false); }, []);
  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDrag(false);
    processFile(e.dataTransfer.files?.[0]);
  }, []);

  // ── Paste from clipboard (Ctrl+V) ──────────────────────────────────────────
  function handlePaste(e) {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
    if (item) processFile(item.getAsFile());
  }

  // ── Hidden inputs ──────────────────────────────────────────────────────────
  const hiddenInputs = (
    <>
      {/* Camera — uses device camera on mobile, file picker on desktop */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      {/* File browser — no camera restriction */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </>
  );

  // ─── Preview state ────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="photo-preview-wrapper" onPaste={handlePaste}>
        {hiddenInputs}

        {/* Thumbnail */}
        <div className="photo-preview-box">
          <img
            src={preview}
            alt="Vehicle photo preview"
            className="photo-thumb"
          />
          {uploading && (
            <div className="photo-uploading-overlay">
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              <span>Uploading…</span>
            </div>
          )}
        </div>

        {/* File meta */}
        {file && (
          <div className="photo-meta">
            📎 <strong>{file.name}</strong> · {(file.size / 1024).toFixed(0)} KB
          </div>
        )}

        {/* Action buttons */}
        <div className="photo-preview-actions">
          <button
            type="button"
            className="btn-photo btn-photo-replace"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            title="Take a new photo with the camera"
          >
            📷 Retake
          </button>
          <button
            type="button"
            className="btn-photo btn-photo-replace"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Choose a different file"
          >
            📁 Replace
          </button>
          <button
            type="button"
            className="btn-photo btn-photo-remove"
            onClick={onClear}
            disabled={uploading}
            title="Remove this photo"
          >
            🗑 Remove
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty / drop zone state ───────────────────────────────────────────────
  return (
    <div
      className={`photo-dropzone${drag ? ' photo-dropzone-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      aria-label="Photo capture area. Drag an image here or click a button below."
    >
      {hiddenInputs}

      {drag ? (
        <>
          <div className="photo-drop-icon">📥</div>
          <div className="photo-drop-hint">Drop image here</div>
        </>
      ) : (
        <>
          <div className="photo-drop-icon">📷</div>
          <div className="photo-drop-hint">
            Drag &amp; drop an image, paste from clipboard, or use a button below
          </div>
          <div className="photo-btn-row">
            <button
              id="photo-camera-btn"
              type="button"
              className="btn-photo"
              onClick={() => cameraRef.current?.click()}
            >
              📷 Take Photo
            </button>
            <button
              id="photo-upload-btn"
              type="button"
              className="btn-photo"
              onClick={() => fileRef.current?.click()}
            >
              📁 Upload File
            </button>
          </div>
          <div className="photo-accepted-formats">
            JPEG · PNG · WebP · HEIC · max 15 MB
          </div>
        </>
      )}
    </div>
  );
}
