const ADMIN_BASE_URL = (import.meta.env.VITE_ADMIN_BASE_URL || '').replace(/\/$/, '');

const buildAdminUrl = (path) => {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return ADMIN_BASE_URL ? `${ADMIN_BASE_URL}${path}` : path;
};

const buildAuthHeaders = (token) => {
  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const ensureSource = (source) => {
  const trimmed = String(source || '').trim();
  if (!trimmed) {
    throw new Error('Log source is required.');
  }
  return encodeURIComponent(trimmed);
};

export const fetchLogSlice = async ({ source, offset = 0, limit = 5000, adminToken }) => {
  if (offset < 0) {
    throw new Error('Offset must be 0 or higher.');
  }
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0.');
  }

  const encodedSource = ensureSource(source);
  const url = new URL(buildAdminUrl(`/admin/logs/${encodedSource}/paginate`), window.location.origin);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildAuthHeaders(adminToken),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to load logs (${response.status}): ${errorText}`);
  }

  return response.json();
};

export const streamLogs = async ({ source, onChunk, signal, adminToken }) => {
  const encodedSource = ensureSource(source);
  const response = await fetch(buildAdminUrl(`/admin/logs/${encodedSource}/stream`), {
    method: 'GET',
    headers: buildAuthHeaders(adminToken),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Unable to stream logs (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming response is not readable in this browser.');
  }

  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: chunkDone } = await reader.read();
    if (chunkDone) {
      done = true;
      break;
    }
    if (value) {
      onChunk?.(decoder.decode(value, { stream: true }));
    }
  }
};

export const authenticateAdmin = async ({ password }) => {
  const payload = { password: String(password || '') };
  if (!payload.password) {
    throw new Error('Password is required.');
  }

  const response = await fetch(buildAdminUrl('/admin/auth'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(`Authentication failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data?.token) {
    throw new Error('Authentication response did not include a token.');
  }

  return data.token;
};

export const exportConversations = async ({
  minRating,
  sinceTimestamp,
  maxTurns = 500,
  adminToken,
}) => {
  const url = new URL(buildAdminUrl('/admin/conversations/export'), window.location.origin);
  if (typeof minRating === 'number') {
    url.searchParams.set('min_rating', String(minRating));
  }
  if (typeof sinceTimestamp === 'number') {
    url.searchParams.set('since_timestamp', String(sinceTimestamp));
  }
  url.searchParams.set('max_turns', String(maxTurns));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildAuthHeaders(adminToken),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to export conversations (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.turns ?? [];
};
