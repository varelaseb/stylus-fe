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

const ensurePositiveLimit = (value, name = 'limit') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${name} must be greater than 0.`);
  }
  return Math.trunc(numeric);
};

const ensureNonNegativeOffset = (value, name = 'offset') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${name} must be 0 or higher.`);
  }
  return Math.trunc(numeric);
};

export const listPlatformFeedback = async ({ limit = 100, offset = 0, adminToken }) => {
  const token = String(adminToken || '').trim();
  if (!token) {
    throw new Error('Admin token is required to load platform feedback.');
  }

  const sanitizedLimit = ensurePositiveLimit(limit);
  const sanitizedOffset = ensureNonNegativeOffset(offset);

  const url = new URL(buildAdminUrl('/admin/platform-feedback'), window.location.origin);
  url.searchParams.set('limit', String(sanitizedLimit));
  url.searchParams.set('offset', String(sanitizedOffset));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to load platform feedback (${response.status}): ${errorText}`);
  }

  return response.json();
};
