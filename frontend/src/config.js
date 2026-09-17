/**
 * config.js — central place for the backend base URL.
 *
 * In development, Vite proxies /api/* to localhost:3000 so relative URLs
 * work fine for API calls. But some resources (PDF iframes, direct image
 * URLs) need an absolute URL pointing to the backend.
 *
 * This module derives the backend origin from the browser's current
 * hostname so the app works correctly from ANY device on the LAN —
 * not just the server machine itself.
 *
 *   On the server:  window.location.hostname = 'localhost'
 *                   → BACKEND_ORIGIN = 'http://localhost:3000'
 *
 *   On a LAN client: window.location.hostname = '192.168.1.5'
 *                    → BACKEND_ORIGIN = 'http://192.168.1.5:3000'
 */

const BACKEND_PORT = 3000;

/**
 * Full origin of the backend server, derived from the current browser host.
 * Use this only for absolute URLs (PDF iframes, static image src, PayHere callbacks).
 * All /api/* fetch calls should use relative paths (proxied by Vite).
 */
export const BACKEND_ORIGIN = `http://${window.location.hostname}:${BACKEND_PORT}`;
