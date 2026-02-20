const DEFAULTS = Object.freeze({
  mcpTarget: 'local',
  mcpLocalBaseUrl: '',
  mcpRemoteBaseUrl: 'https://api.siftstylus.xyz',
  skillsApiBaseUrl: '',
  openRouterProxyUrl: '/openrouter/chat/completions',
  model: 'google/gemini-2.0-flash-exp',
  fallbackModel: 'openai/gpt-4o-mini',
  skillsInstallerPackage: 'sift-stylus',
  skillsInstallRepo: 'getFairAI/angel-stylus-coding-assistant',
});

const normalizeMcpTarget = (value) => (String(value || '').trim().toLowerCase() === 'remote' ? 'remote' : 'local');

const mcpTarget = normalizeMcpTarget(import.meta.env.VITE_MCP_TARGET || DEFAULTS.mcpTarget);
const mcpLocalBaseUrl = import.meta.env.VITE_MCP_LOCAL_BASE_URL ?? DEFAULTS.mcpLocalBaseUrl;
const mcpRemoteBaseUrl = import.meta.env.VITE_MCP_REMOTE_BASE_URL ?? DEFAULTS.mcpRemoteBaseUrl;

const resolvedSkillsApiBaseUrl =
  import.meta.env.VITE_SKILLS_API_BASE_URL ||
  (mcpTarget === 'remote' ? mcpRemoteBaseUrl : mcpLocalBaseUrl) ||
  DEFAULTS.skillsApiBaseUrl;

export const appEnv = Object.freeze({
  mcpTarget,
  mcpLocalBaseUrl,
  mcpRemoteBaseUrl,
  skillsApiBaseUrl: resolvedSkillsApiBaseUrl,
  openRouterProxyUrl: import.meta.env.VITE_OPENROUTER_PROXY_URL || DEFAULTS.openRouterProxyUrl,
  model: import.meta.env.VITE_LLM_MODEL || DEFAULTS.model,
  fallbackModel: import.meta.env.VITE_LLM_FALLBACK_MODEL || DEFAULTS.fallbackModel,
  skillsInstallerPackage:
    import.meta.env.VITE_SKILLS_INSTALLER_PACKAGE || DEFAULTS.skillsInstallerPackage,
  skillsInstallRepo: import.meta.env.VITE_SKILLS_INSTALL_REPO || DEFAULTS.skillsInstallRepo,
  researchSystemPrompt: import.meta.env.VITE_RESEARCH_SYSTEM_PROMPT || '',
  portingAuditorSystemPrompt: import.meta.env.VITE_PORTING_AUDITOR_SYSTEM_PROMPT || '',
});
