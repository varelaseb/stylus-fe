import { appEnv } from '../config/env';
import { getSkillSearchPath } from '../skills/catalog';

const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const stripSkillsSuffix = (value) => value.replace(/\/skills$/, '');

const getSkillsApiBase = () => trimTrailingSlash(appEnv.skillsApiBaseUrl);

const buildSkillSearchUrl = (skillId) => {
  const skillPath = getSkillSearchPath(skillId);
  const base = getSkillsApiBase();

  if (!base) {
    return skillPath;
  }

  if (base.endsWith('/skills') && skillPath.startsWith('/skills/')) {
    return `${base}${skillPath.slice('/skills'.length)}`;
  }

  return `${base}${skillPath}`;
};

const buildHealthUrl = () => {
  const base = getSkillsApiBase();
  if (!base) {
    return '/health';
  }

  return `${stripSkillsSuffix(base)}/health`;
};

const postJson = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Search API error (${response.status})`);
  }

  return response.json();
};

export const getKnowledgeBaseHealth = async () => {
  const healthUrl = buildHealthUrl();
  return fetch(healthUrl, { method: 'GET' });
};

export const runSkillSearch = async ({ skillId, query }) => {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    throw new Error('Search query is required.');
  }

  const apiUrl = buildSkillSearchUrl(skillId);
  return postJson(apiUrl, { prompt: normalizedQuery });
};
