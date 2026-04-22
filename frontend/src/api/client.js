// Centralized API client for the frontend.

const DEFAULT_BASE = process.env.REACT_APP_API_URL || '';

export function apiBase() { return DEFAULT_BASE; }

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api(path, { method = 'GET', body, headers, signal, formData } = {}) {
  const init = { method, headers: { ...(headers || {}) }, signal };
  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${DEFAULT_BASE}${path}`, init);
  const text = await res.text();
  let parsed = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }
  if (!res.ok) {
    const msg = (parsed && parsed.detail) || res.statusText || 'Request failed';
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed;
}