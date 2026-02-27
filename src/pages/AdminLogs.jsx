import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  authenticateAdmin,
  exportConversations,
  fetchLogSlice,
  streamLogs,
} from '../services/adminLogs';

const KNOWN_SOURCES = ['ingestion', 'requests', 'stats'];
const ADMIN_TOKEN_STORAGE_KEY = 'stylus-admin-token';

const formatNumber = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value || '—';
  }
  return numeric.toLocaleString();
};

const maskToken = (token) => {
  if (!token) {
    return 'Not authenticated';
  }
  return `••••${token.slice(-4)}`;
};

const PREVIEW_LIMIT = 120;
const RATING_BADGES = {
  '1': { label: 'positive', background: '#dcfce7', color: '#166534' },
  '0': { label: 'neutral', background: '#fef9c3', color: '#92400e' },
  '-1': { label: 'negative', background: '#fee2e2', color: '#991b1b' },
};
const UNRATED_BADGE = { label: 'unrated', background: '#e2e8f0', color: '#0f172a' };

const toSafeText = (value, fallback) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  return String(value);
};

const getRatingBadgeMeta = (rating) => {
  const numeric = Number(rating);
  const key = Number.isFinite(numeric) ? String(Math.trunc(numeric)) : '';
  return RATING_BADGES[key] ?? UNRATED_BADGE;
};

const formatPreviewSnippet = (text) =>
  text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;

const AdminLogs = () => {
  const [source, setSource] = useState('ingestion');
  const [offsetInput, setOffsetInput] = useState('0');
  const [limitInput, setLimitInput] = useState('5000');
  const [logSlice, setLogSlice] = useState('');
  const [sliceMeta, setSliceMeta] = useState(null);
  const [sliceError, setSliceError] = useState('');
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingError, setStreamingError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(null);
  const [minRating, setMinRating] = useState('');
  const [sinceInput, setSinceInput] = useState('');
  const [maxTurnsInput, setMaxTurnsInput] = useState('500');
  const [exportResults, setExportResults] = useState([]);
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState({});

  const streamControllerRef = useRef(null);

  const parsedOffset = useMemo(() => Number(offsetInput), [offsetInput]);
  const parsedLimit = useMemo(() => Number(limitInput), [limitInput]);
  const safeOffset =
    Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5000;
  const canQueryLogs = Boolean(adminToken);
  const parsedMinRatingValue = Number(minRating);
  const minRatingParam = Number.isFinite(parsedMinRatingValue) ? parsedMinRatingValue : undefined;
  const parsedMaxTurns =
    Number(maxTurnsInput) > 0 ? Number(maxTurnsInput) : 500;
  const parseSinceTimestamp = () => {
    if (!sinceInput) {
      return undefined;
    }
    const parsed = Date.parse(sinceInput);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return Math.floor(parsed / 1000);
  };
  const sinceLabel = (() => {
    const parsed = parseSinceTimestamp();
    if (typeof parsed === 'number') {
      return new Date(parsed * 1000).toLocaleString();
    }
    if (sinceInput) {
      return 'Invalid time';
    }
    return 'start';
  })();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (storedToken) {
      setAdminToken(storedToken);
    }
  }, []);

  useEffect(() => {
    setLogSlice('');
    setSliceMeta(null);
  }, [source]);

  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!authMessage && !authError) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setAuthMessage('');
      setAuthError('');
    }, 3600);
    return () => clearTimeout(timer);
  }, [authMessage, authError]);

  useEffect(() => {
    setExpandedTurns({});
  }, [exportResults]);

  const handleAuthenticate = async () => {
    if (!passwordInput.trim()) {
      setAuthError('Password is required.');
      return;
    }

    setAuthError('');
    setAuthMessage('');
    setIsAuthenticating(true);

    try {
      const token = await authenticateAdmin({ password: passwordInput });
      setAdminToken(token);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      }
      setPasswordInput('');
      setAuthMessage('Authenticated. You can now query logs.');
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
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setAdminToken('');
    setStreamingContent('');
    setIsStreaming(false);
    setAuthMessage('Token cleared.');
  };

  const handleFetchSlice = async () => {
    if (!canQueryLogs) {
      setSliceError('Authenticate before loading logs.');
      return;
    }

    setSliceError('');
    setIsLoadingSlice(true);
    try {
      const payload = await fetchLogSlice({
        source,
        offset: safeOffset,
        limit: safeLimit,
        adminToken,
      });
      setLogSlice(payload.data || '');
      setOffsetInput(String(payload.offset ?? safeOffset));
      setSliceMeta({
        source: payload.source,
        offset: payload.offset ?? safeOffset,
        nextOffset:
          payload.next_offset ?? (payload.offset ?? safeOffset) + safeLimit,
        hasMore: payload.has_more ?? false,
      });
    } catch (error) {
      setSliceError(error?.message || 'Unable to load logs.');
    } finally {
      setIsLoadingSlice(false);
    }
  };

  const handleApplyPagination = (newOffset) => {
    setOffsetInput(String(Math.max(0, newOffset)));
  };

  const handleStartStreaming = async () => {
    if (!canQueryLogs) {
      setStreamingError('Authenticate before streaming.');
      return;
    }

    setStreamingError('');
    setStreamingContent('');
    streamControllerRef.current?.abort();
    const controller = new AbortController();
    streamControllerRef.current = controller;
    setIsStreaming(true);

    try {
      await streamLogs({
        source,
        signal: controller.signal,
        onChunk: (chunk) => {
          setStreamingContent((prev) => {
            const next = `${prev}${chunk}`;
            return next.length > 20000 ? next.slice(-20000) : next;
          });
        },
        adminToken,
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setStreamingError(error?.message || 'Stream ended unexpectedly.');
      }
    } finally {
      setIsStreaming(false);
      streamControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setIsStreaming(false);
  };

  const handleExportConversations = async () => {
    if (!canQueryLogs) {
      setExportError('Authenticate before exporting conversations.');
      return;
    }

    setExportError('');
    setIsExporting(true);
    try {
      const turns = await exportConversations({
        minRating: minRatingParam,
        sinceTimestamp: parseSinceTimestamp(),
        maxTurns: parsedMaxTurns,
        adminToken,
      });
      setExportResults(Array.isArray(turns) ? turns : []);
    } catch (error) {
      setExportError(error?.message || 'Unable to export conversations.');
      setExportResults([]);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleTurnExpansion = (turnKey) => {
    setExpandedTurns((prev) => ({
      ...prev,
      [turnKey]: !prev[turnKey],
    }));
  };

  const fullScreenTitle = fullScreenMode === 'slice' ? 'Paginated slice' : 'Stream tail';
  const fullScreenContent =
    fullScreenMode === 'slice'
      ? sliceError || logSlice || 'No data yet. Load a slice to view logs.'
      : streamingContent || 'Stream output will appear here after starting the stream.';

  return (
    <section className="section" style={{ paddingTop: '6.5rem', background: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Admin tools</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Log inspector</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '720px', margin: '0.5rem auto 0' }}>
            Authenticate with your admin password to fetch paginated slices or stream the latest log tail.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderRadius: '18px',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Admin authentication</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Password only</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            The password is exchanged for a short-lived token via `/admin/auth` and never exposed directly in the UI.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Admin password"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.95rem', padding: '0.65rem 1.2rem' }}
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Authenticating…' : 'Authenticate'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.95rem', padding: '0.65rem 1rem' }}
              onClick={handleClearToken}
              disabled={!adminToken}
            >
              Sign out
            </button>
          </div>

          {authError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{authError}</p>
          )}
          {authMessage && (
            <p style={{ color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{authMessage}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            <span>Token stored: {maskToken(adminToken)}</span>
            {canQueryLogs ? (
              <span style={{ color: '#16a34a' }}>Ready to query</span>
            ) : (
              <span style={{ color: '#c2410c' }}>Authenticate first</span>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center',
          }}
        >
          {KNOWN_SOURCES.map((knownSource) => (
            <button
              key={knownSource}
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
              onClick={() => setSource(knownSource)}
            >
              {knownSource}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'white',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Paginated slice</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>offset + limit</span>
            </div>

            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Log source</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="e.g. ingestion"
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
                gap: '0.75rem',
                marginBottom: '0.25rem',
              }}
            >
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Offset
                <input
                  type="number"
                  min="0"
                  value={offsetInput}
                  onChange={(event) => setOffsetInput(event.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </label>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Limit
                <input
                  type="number"
                  min="1"
                  value={limitInput}
                  onChange={(event) => setLimitInput(event.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.95rem' }}
                onClick={handleFetchSlice}
                disabled={isLoadingSlice || !canQueryLogs || !source}
              >
                {isLoadingSlice ? 'Loading…' : 'Load slice'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.95rem' }}
                onClick={() => handleApplyPagination(safeOffset - safeLimit)}
                disabled={safeOffset <= 0 || isLoadingSlice || !canQueryLogs}
              >
                Prev chunk
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.95rem' }}
                onClick={() =>
                  handleApplyPagination(sliceMeta?.nextOffset ?? safeOffset + safeLimit)
                }
                disabled={sliceMeta?.hasMore === false || isLoadingSlice || !canQueryLogs}
              >
                Next chunk
              </button>
            </div>

            <div
              style={{
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
              }}
            >
              <span>Source: {sliceMeta?.source || '—'}</span>
              <span>Offset: {formatNumber(sliceMeta?.offset)}</span>
              <span>Next: {formatNumber(sliceMeta?.nextOffset)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                onClick={() => {
                  if (!fullScreenMode) {
                    setFullScreenMode('slice');
                  }
                }}
              >
                Expand to full screen
              </button>
            </div>
            <div
              style={{
                minHeight: '220px',
                maxHeight: '320px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: '#0f172a',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                padding: '1rem',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {sliceError || logSlice || 'No data yet. Load a slice to view logs.'}
            </div>
          </div>

          <div
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'white',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Stream tail</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Live chunked stream</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Streaming pulls the full log file in chunks; cancel anytime to stop reading.
            </p>

            <div
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}
            >
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.95rem' }}
                onClick={handleStartStreaming}
                disabled={isStreaming || !canQueryLogs || !source}
              >
                {isStreaming ? 'Streaming…' : 'Start stream'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.95rem' }}
                onClick={handleStopStreaming}
                disabled={!isStreaming}
              >
                Stop
              </button>
            </div>

            {streamingError ? (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{streamingError}</p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Showing last ~20k characters received.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                onClick={() => {
                  if (!fullScreenMode) {
                    setFullScreenMode('stream');
                  }
                }}
              >
                Expand to full screen
              </button>
            </div>
            <div
              style={{
                minHeight: '240px',
                maxHeight: '320px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: '#0f172a',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                padding: '1rem',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {streamingContent || 'Stream output will appear here after starting the stream.'}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '1.75rem',
            borderRadius: '16px',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            marginTop: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Rated answers export</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>For retraining / auditing</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Pull rated turns via <code>/admin/conversations/export</code> so you can reuse the prompts/responses for retraining or investigation.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Min rating (optional)
              <input
                type="number"
                min="1"
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                placeholder="Leave empty to include all"
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              />
            </label>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Since timestamp
              <input
                type="datetime-local"
                value={sinceInput}
                onChange={(event) => setSinceInput(event.target.value)}
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              />
            </label>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Max turns
              <input
                type="number"
                min="1"
                value={maxTurnsInput}
                onChange={(event) => setMaxTurnsInput(event.target.value)}
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.95rem' }}
              onClick={handleExportConversations}
              disabled={isExporting || !canQueryLogs}
            >
              {isExporting ? 'Exporting…' : 'Export conversations'}
            </button>
            {!canQueryLogs && (
              <span style={{ fontSize: '0.85rem', color: '#c2410c' }}>Authenticate to enable export</span>
            )}
          </div>

          {exportError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{exportError}</p>
          )}

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Filters → Min rating: {minRatingParam ?? 'any'}, Since: {sinceLabel}, Max turns: {parsedMaxTurns}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Returned turns: {exportResults.length}
          </p>
          <div
            style={{
              minHeight: '220px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'var(--font-mono)',
              padding: '1rem',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4,
            }}
          >
            {exportResults.length === 0 && (
              <p>No exported turns yet. Run the export to see results.</p>
            )}
            {exportResults.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '500px' }}>
                {exportResults.map((turn, index) => {
                  const baseId = turn.turn_id ?? index;
                  const turnKey = `${baseId}-${turn.rating ?? 'x'}`;
                  const promptText = toSafeText(turn.prompt, 'prompt unavailable');
                  const responseText = toSafeText(turn.response, 'response unavailable');
                  const promptPreview = formatPreviewSnippet(promptText);
                  const responsePreview = formatPreviewSnippet(responseText);
                  const ratingMeta = getRatingBadgeMeta(turn.rating);
                  const detailPieces = [];
                  if (turn.skill) {
                    detailPieces.push(`skill: ${turn.skill}`);
                  }
                  if (turn.timestamp) {
                    detailPieces.push(
                      `ts: ${new Date(turn.timestamp * 1000).toLocaleString()}`
                    );
                  }
                  const shouldShowViewMore =
                    promptText.length > PREVIEW_LIMIT || responseText.length > PREVIEW_LIMIT;
                  const isExpanded = Boolean(expandedTurns[turnKey]);
                  return (
                    <li key={turnKey} style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          borderRadius: '12px',
                          border: '1px solid rgba(15, 23, 42, 0.12)',
                          background: 'white',
                          padding: '1rem',
                          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '0.35rem',
                          }}
                        >
                          <strong style={{ fontSize: '0.9rem' }}>Turn {index + 1}</strong>
                          <span
                            style={{
                              borderRadius: '999px',
                              padding: '0.35rem 0.9rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              background: ratingMeta.background,
                              color: ratingMeta.color,
                            }}
                          >
                            {ratingMeta.label}
                          </span>
                        </div>
                        {detailPieces.length > 0 && (
                          <p
                            style={{
                              margin: '0.35rem 0 0',
                              fontSize: '0.8rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {detailPieces.join(' • ')}
                          </p>
                        )}
                        <div style={{ marginTop: '0.7rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              gap: '0.5rem',
                            }}
                          >
                            <strong
                              style={{
                                fontSize: '0.82rem',
                                color: '#4c1d95',
                              }}
                            >
                              Prompt
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#475569' }}>Preview</span>
                          </div>
                          <p
                            style={{
                              margin: '0.15rem 0 0',
                              fontSize: '0.8rem',
                              whiteSpace: 'pre-wrap',
                              color: '#0f172a',
                            }}
                          >
                            {isExpanded ? promptText : promptPreview}
                          </p>
                        </div>
                        <div style={{ marginTop: '0.55rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              gap: '0.5rem',
                            }}
                          >
                            <strong
                              style={{
                                fontSize: '0.82rem',
                                color: '#0c4a6e',
                              }}
                            >
                              Response
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                              {isExpanded ? 'Full' : 'Preview'}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: '0.15rem 0 0',
                              fontSize: '0.8rem',
                              whiteSpace: 'pre-wrap',
                              color: '#0f172a',
                            }}
                          >
                            {isExpanded ? responseText : responsePreview}
                          </p>
                        </div>
                        {shouldShowViewMore && (
                          <div
                            style={{
                              marginTop: '0.65rem',
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleTurnExpansion(turnKey)}
                              aria-expanded={isExpanded}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: '#1d4ed8',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                padding: 0,
                                cursor: 'pointer',
                              }}
                            >
                              {isExpanded
                                ? 'Hide full prompt & response'
                                : 'View full prompt & response'}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {fullScreenMode && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              background: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '960px',
                background: '#0f172a',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.2)',
                  background: '#0f172a',
                }}
              >
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>{fullScreenTitle} (full screen)</h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.65rem' }}
                  onClick={() => setFullScreenMode(null)}
                >
                  Close
                </button>
              </div>
              <div
                style={{
                  padding: '1rem',
                  flex: 1,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono)',
                  color: '#e2e8f0',
                  lineHeight: 1.4,
                }}
              >
                {fullScreenContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminLogs;
