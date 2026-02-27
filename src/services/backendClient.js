import { appEnv } from '../config/env';
import { getSkillSearchPath, getSkillById } from '../skills/catalog';

const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const stripSkillsSuffix = (value) => value.replace(/\/skills$/, '');

const getSkillsApiBase = () => trimTrailingSlash(appEnv.skillsApiBaseUrl);
let skillsIndexCache = null;

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

const buildSkillsIndexUrl = () => {
  const base = getSkillsApiBase();
  if (!base) {
    return '/skills';
  }

  if (base.endsWith('/skills')) {
    return base;
  }

  return `${base}/skills`;
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

export const getSkillsIndex = async () => {
  if (skillsIndexCache) {
    return skillsIndexCache;
  }

  const response = await fetch(buildSkillsIndexUrl(), { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Skills index error (${response.status})`);
  }

  const payload = await response.json();
  const skills = Array.isArray(payload?.skills) ? payload.skills : [];
  skillsIndexCache = skills;
  return skillsIndexCache;
};

export const getSkillSystemPrompt = async (skillId) => {
  const skills = await getSkillsIndex();
  const skill = skills.find((item) => item?.id === skillId);
  const prompt = String(skill?.system_prompt || '').trim();
  return prompt;
};

export const runSkillSearch = async ({ skillId, query }) => {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    throw new Error('Search query is required.');
  }

  const apiUrl = buildSkillSearchUrl(skillId);
  return postJson(apiUrl, { prompt: normalizedQuery });
};

export const buildFeedbackUrl = () => {
  const base = getSkillsApiBase();
  if (!base) {
    return '/feedback';
  }

  return `${stripSkillsSuffix(base)}/feedback`;
}

export const postFeedback = async ({ skillId, response, rating, prompt }) => {
  const skill = getSkillById(skillId).id;
  const apiUrl = buildFeedbackUrl();

  return postJson(apiUrl, { prompt, response, rating, skill }); 
}