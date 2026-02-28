import React, { useCallback, useEffect, useState } from 'react';
import { authenticateAdmin } from '../services/adminLogs';
import { listPlatformFeedback } from '../services/platformFeedback';

const ADMIN_TOKEN_STORAGE_KEY = 'stylus-admin-token';
const DEFAULT_LIMIT = 100;
const MAX_MESSAGE_PREVIEW_LENGTH = 140;

const getPreviewMessage = (message) => {
  const text = message == null ? '' : String(message);
  if (!text) {
    return '—';
  }
  return text.length > MAX_MESSAGE_PREVIEW_LENGTH ? `${text.slice(0, MAX_MESSAGE_PREVIEW_LENGTH)}…` : text;
};

const formatTimestamp = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'Invalid';
  }
  const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid';
  }
  return date.toLocaleString();
};

const getSourceLabel = (source) => {
  const trimmed = String(source || '').trim();
  return trimmed || 'unknown';
};

const AdminFeedback = () => {
  const [adminToken, setAdminToken] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ offset: 0, nextOffset: 0, hasMore: false });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [expandedRowKey, setExpandedRowKey] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (storedToken) {
      setAdminToken(storedToken);
    }
  }, []);

  const fetchPage = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      if (!adminToken) {
        setFetchError('Authenticate to load platform feedback.');
        return;
      }

      setIsLoading(true);
      setFetchError('');

      try {
        const response = await listPlatformFeedback({ limit: DEFAULT_LIMIT, offset, adminToken });
        const feedback = Array.isArray(response?.feedback) ? response.feedback : [];
        setEntries((previous) => (append ? [...previous, ...feedback] : feedback));
        const nextOffset = Number.isFinite(response?.next_offset)
          ? response.next_offset
          : offset + feedback.length;
        setPagination({
          offset,
          nextOffset,
          hasMore: Boolean(response?.has_more),
        });
      } catch (error) {
        setFetchError(error?.message || 'Failed to load platform feedback.');
      } finally {
        setIsLoading(false);
      }
    },
    [adminToken],
  );

  useEffect(() => {
    if (!adminToken) {
      setEntries([]);
      setPagination({ offset: 0, nextOffset: 0, hasMore: false });
      return;
    }
    void fetchPage({ offset: 0, append: false });
  }, [adminToken, fetchPage]);

  const handleAuthenticate = async () => {
    if (!passwordInput.trim()) {
      setAuthError('Password is required.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');
    setAuthMessage('');

    try {
      const token = await authenticateAdmin({ password: passwordInput });
      setAdminToken(token);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      }
      setPasswordInput('');
      setAuthMessage('Authenticated. Feedback will refresh shortly.');
    } catch (error) {
      setAuthError(error?.message || 'Authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClearToken = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
    setAdminToken('');
    setEntries([]);
    setPagination({ offset: 0, nextOffset: 0, hasMore: false });
    setAuthMessage('Admin token cleared.');
    setFetchError('');
  };

  const handleRefresh = () => {
    if (!adminToken) {
      setFetchError('Authenticate to load platform feedback.');
      return;
    }
    void fetchPage({ offset: 0, append: false });
  };

  const handleLoadMore = () => {
    if (!pagination.hasMore) {
      return;
    }
    const offsetToFetch = Number.isFinite(pagination.nextOffset)
      ? pagination.nextOffset
      : pagination.offset + DEFAULT_LIMIT;
    void fetchPage({ offset: offsetToFetch, append: true });
  };

  const toggleRowExpansion = (entryKey) => {
    setExpandedRowKey((prev) => (prev === entryKey ? null : entryKey));
  };

  const handleRowKeyDown = (event, entryKey) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleRowExpansion(entryKey);
    }
  };

  return (
    <section className="section" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Platform feedback</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Review direct notes submitted through the landing page and keep tabs on what customers are trying to tell Sifter.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Admin access</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '240px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Password</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="••••••••"
                style={{
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  padding: '0.65rem 0.85rem',
                  minWidth: '240px',
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Authenticating…' : 'Authenticate'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleClearToken}
              disabled={!adminToken && !authMessage}
            >
              Clear token
            </button>
          </div>
          <div style={{ marginTop: '0.75rem', minHeight: '1.5rem' }}>
            {authMessage && <p className="feedback-status">{authMessage}</p>}
            {authError && (
              <p className="feedback-status" style={{ color: 'var(--color-stylus-pink)' }}>
                {authError}
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Feedback feed</p>
              <p className="feedback-status" style={{ marginTop: '0.25rem' }}>
                {entries.length} entries · limit {DEFAULT_LIMIT} · {pagination.hasMore ? 'more available' : 'at end'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={!adminToken || isLoading}>
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={!pagination.hasMore || isLoading}
              >
                {isLoading && pagination.hasMore ? 'Loading more…' : 'Load more'}
              </button>
            </div>
          </div>

          {fetchError && (
            <p className="feedback-status" style={{ marginTop: '1rem', color: 'var(--color-stylus-pink)' }}>
              {fetchError}
            </p>
          )}

          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Message</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {entries.length
                  ? entries.map((entry) => {
                      const entryKey = `${entry.id}-${entry.timestamp}`;
                      const messageText = entry.message == null ? '' : String(entry.message);
                      const previewText = getPreviewMessage(messageText);
                      const isTruncated = messageText.length > MAX_MESSAGE_PREVIEW_LENGTH;
                      const isExpanded = expandedRowKey === entryKey;
                      return (
                        <React.Fragment key={entryKey}>
                          <tr
                            className={`feedback-row ${isExpanded ? 'is-expanded' : ''}`}
                            onClick={() => toggleRowExpansion(entryKey)}
                            onKeyDown={(event) => handleRowKeyDown(event, entryKey)}
                            tabIndex={0}
                            role="button"
                            aria-expanded={isExpanded}
                            aria-label={`Feedback entry ${entry.id}`}
                           
                          >
                            <td>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{`${entry.id.slice(0, 7)}…`}</div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatTimestamp(entry.timestamp)}</td>
                            <td className="feedback-message" title={messageText || 'No message'}>
                              {previewText}
                              {isTruncated && (
                                <span className="feedback-message-hint">
                                  {isExpanded ? 'Hide message' : 'Show full message'}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="feedback-source-pill">{getSourceLabel(entry.source)}</span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="feedback-details-row">
                              <td colSpan={4}>
                                <p className="feedback-message-full">{messageText || 'No message provided.'}</p>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  : (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        {!adminToken ? 'Authenticate to load platform feedback.' : isLoading ? 'Loading feedback…' : 'No feedback records yet.'}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p className="feedback-status" style={{ margin: 0 }}>
              Offset {pagination.offset} · Next offset {pagination.nextOffset}
            </p>
            <p className="feedback-status" style={{ margin: 0 }}>
              {pagination.hasMore ? 'More pages available.' : 'Reached the end of the feedback stream.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminFeedback;
