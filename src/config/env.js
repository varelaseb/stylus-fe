const DEFAULTS = Object.freeze({
  mcpTarget: 'local',
  mcpLocalBaseUrl: '',
  mcpRemoteBaseUrl: 'https://sifter.azule.xyz',
  skillsApiBaseUrl: '',
  openRouterProxyUrl: '/openrouter/chat/completions',
  model: 'google/gemini-2.0-flash-exp',
  fallbackModel: 'openai/gpt-4o-mini',
  skillsInstallerPackage: 'sift-stylus',
  skillsInstallRepo: 'getFairAI/angel-stylus-coding-assistant',
  feedbackEndpoint: 'https://api.siftstylus.xyz/user-feedback',
});

const normalizeMcpTarget = (value) => (String(value || '').trim().toLowerCase() === 'remote' ? 'remote' : 'local');
const remapLegacyApiHost = (value) =>
  String(value || '')
    .trim()
    .replace(/^https?:\/\/api\.siftstylus\.xyz(?=\/|$)/i, 'https://sifter.azule.xyz');

const mcpTarget = normalizeMcpTarget(import.meta.env.VITE_MCP_TARGET || DEFAULTS.mcpTarget);
const mcpLocalBaseUrl = remapLegacyApiHost(import.meta.env.VITE_MCP_LOCAL_BASE_URL ?? DEFAULTS.mcpLocalBaseUrl);
const mcpRemoteBaseUrl = remapLegacyApiHost(import.meta.env.VITE_MCP_REMOTE_BASE_URL ?? DEFAULTS.mcpRemoteBaseUrl);
const explicitSkillsApiBaseUrl = remapLegacyApiHost(import.meta.env.VITE_SKILLS_API_BASE_URL || '');

const resolvedSkillsApiBaseUrl =
  explicitSkillsApiBaseUrl ||
  (mcpTarget === 'remote' ? mcpRemoteBaseUrl : mcpLocalBaseUrl) ||
  DEFAULTS.skillsApiBaseUrl;

export const appEnv = Object.freeze({
  mcpTarget,
  mcpLocalBaseUrl,
  mcpRemoteBaseUrl,
  skillsApiBaseUrl: resolvedSkillsApiBaseUrl,
  openRouterProxyUrl: remapLegacyApiHost(import.meta.env.VITE_OPENROUTER_PROXY_URL || DEFAULTS.openRouterProxyUrl),
  model: import.meta.env.VITE_LLM_MODEL || DEFAULTS.model,
  fallbackModel: import.meta.env.VITE_LLM_FALLBACK_MODEL || DEFAULTS.fallbackModel,
  skillsInstallerPackage:
    import.meta.env.VITE_SKILLS_INSTALLER_PACKAGE || DEFAULTS.skillsInstallerPackage,
  skillsInstallRepo: import.meta.env.VITE_SKILLS_INSTALL_REPO || DEFAULTS.skillsInstallRepo,
  feedbackEndpoint: import.meta.env.VITE_FEEDBACK_ENDPOINT || DEFAULTS.feedbackEndpoint,
});
