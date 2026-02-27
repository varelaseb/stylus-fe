export const SKILL_IDS = Object.freeze({
  RESEARCH: 'sift-stylus-research',
  PORTING_AUDITOR: 'sift-stylus-porting-auditor',
});
export const DEFAULT_SKILL_ID = SKILL_IDS.RESEARCH;

const DEFAULT_GENERIC_SYSTEM_PROMPT = [
  'You are Sifter.',
  'Use available tools to gather evidence before final answers when needed.',
  'Return concise, useful answers with references when available.',
  'If evidence is weak or incomplete, state uncertainty clearly.',
].join(' ');

const RESEARCH_SKILL = Object.freeze({
  id: SKILL_IDS.RESEARCH,
  label: 'Stylus Research',
  shortLabel: 'Research',
  searchPath: `/skills/${SKILL_IDS.RESEARCH}/search`,
  description: 'Evidence-backed answers with links across docs, repos, and community sources.',
  systemPrompt: DEFAULT_GENERIC_SYSTEM_PROMPT,
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
  systemPrompt: DEFAULT_GENERIC_SYSTEM_PROMPT,
  suggestedPrompts: [
    'Analyze https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol and return a porting verdict.',
    'Analyze https://github.com/gmx-io/gmx-contracts and identify high_stylus_benefit vs low_stylus_impact targets.',
    'Analyze ./contracts and identify high_stylus_benefit vs low_stylus_impact targets.',
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
