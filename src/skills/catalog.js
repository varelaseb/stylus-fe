import { appEnv } from '../config/env';

export const SKILL_IDS = Object.freeze({
  RESEARCH: 'sift-stylus-research',
  PORTING_AUDITOR: 'sift-stylus-porting-auditor',
});
export const DEFAULT_SKILL_ID = SKILL_IDS.RESEARCH;

const DEFAULT_RESEARCH_SYSTEM_PROMPT = [
  'You are Sifter, a research assistant for Arbitrum Stylus developers.',
  'Use search_stylus_docs for technical Stylus questions before final answers.',
  'Do not generate contract or application code.',
  'Answer references-first: links/repositories/docs first, concise guidance second.',
  'Format references as markdown hyperlinks whenever possible.',
  'If retrieval is insufficient, say so clearly.',
].join(' ');

const DEFAULT_PORTING_AUDITOR_SYSTEM_PROMPT = [
  'You are Sifter operating the sift-stylus-porting-auditor skill.',
  'Your goal is impact judgment, not migration planning.',
  'In a hybrid Solidity and Rust architecture, decide if porting a contract to Stylus is high benefit or low impact.',
  'When the user gives a contract or repo target, provide direct analysis for that target; do not return generic resource lists.',
  'Always give a short high-level prose stance before numeric details: port now, pilot first, or defer.',
  'Always include an impact classification: high_stylus_benefit or low_stylus_impact.',
  'Never return references-only output. Verdict first, evidence second.',
  'Use this structure: Stance, Impact, Drivers, Risks/Caveats, Evidence.',
  'Prefer independent and anecdotal evidence over official docs, while still respecting feasibility and security constraints.',
  'Use search_stylus_docs before final conclusions when you need evidence.',
  'Do not synthesize production contract code unless the user explicitly asks for it.',
].join(' ');

const RESEARCH_SKILL = Object.freeze({
  id: SKILL_IDS.RESEARCH,
  label: 'Stylus Research',
  shortLabel: 'Research',
  searchPath: `/skills/${SKILL_IDS.RESEARCH}/search`,
  description: 'Evidence-backed answers with links across docs, repos, and community sources.',
  systemPrompt: appEnv.researchSystemPrompt || DEFAULT_RESEARCH_SYSTEM_PROMPT,
  suggestedPrompts: [
    'What are the newest Stylus tools and what do they do?',
    'I need references for test patterns in Stylus smart contracts.',
    'How do teams usually deploy and verify Stylus contracts now?',
    'What community projects are active in the Stylus ecosystem right now?',
  ],
});

const PORTING_AUDITOR_SKILL = Object.freeze({
  id: SKILL_IDS.PORTING_AUDITOR,
  label: 'Porting Auditor',
  shortLabel: 'Auditor',
  searchPath: `/skills/${SKILL_IDS.PORTING_AUDITOR}/search`,
  description:
    'Assess Solidity contracts for likely Stylus upside in a hybrid Solidity and Rust codebase.',
  systemPrompt: appEnv.portingAuditorSystemPrompt || DEFAULT_PORTING_AUDITOR_SYSTEM_PROMPT,
  suggestedPrompts: [
    'Analyze https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol and return a porting verdict.',
    'Analyze https://github.com/gmx-io/gmx-contracts and identify high_stylus_benefit vs low_stylus_impact targets.',
    'Given this contract URL, return: stance (port now/pilot first/defer), impact class, drivers, and caveats.',
    'Is this contract a strong Stylus candidate in a hybrid Solidity + Rust architecture? Give a direct verdict.',
  ],
});

export const SKILL_CATALOG = Object.freeze({
  [SKILL_IDS.RESEARCH]: RESEARCH_SKILL,
  [SKILL_IDS.PORTING_AUDITOR]: PORTING_AUDITOR_SKILL,
});

export const SKILL_OPTIONS = Object.freeze([
  {
    id: SKILL_IDS.RESEARCH,
    label: RESEARCH_SKILL.label,
    description: RESEARCH_SKILL.description,
  },
  {
    id: SKILL_IDS.PORTING_AUDITOR,
    label: PORTING_AUDITOR_SKILL.label,
    description: PORTING_AUDITOR_SKILL.description,
  },
]);

export const getSkillById = (skillId) => SKILL_CATALOG[skillId] || SKILL_CATALOG[DEFAULT_SKILL_ID];

export const getSuggestedPromptsForSkill = (skillId) => {
  const prompts = [...getSkillById(skillId).suggestedPrompts];
  return [...new Set(prompts)];
};

export const getSkillSearchPath = (skillId) => getSkillById(skillId).searchPath;

export const buildInitialAssistantMessage = (skillId = DEFAULT_SKILL_ID) => {
  const skill = getSkillById(skillId);
  return {
    role: 'assistant',
    skillId: skill.id,
    content: `Hi, you are in ${skill.label}. Ask a question and I will prioritize source-backed guidance.`,
  };
};
