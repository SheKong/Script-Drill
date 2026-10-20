export type CourseId = string;
export type ItemKind = 'consonant' | 'vowel' | 'symbol' | 'rule' | 'word' | 'number';

export interface Source {
  id: string;
  title: string;
  organization: string;
  url: string;
  description: string;
}

export interface Recording {
  src: string;
  title: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
}

export interface Knowledge {
  id: string;
  courseId: CourseId;
  kind: ItemKind;
  glyph: string;
  roman: string;
  ipa: string;
  title: string;
  explanation: string;
  group: string;
  sources: string[];
  requires: string[];
  officialRoman?: string;
  final?: string;
  class?: '中' | '高' | '低';
  meaning?: string;
  context?: string;
  segments?: { text: string; reading: string; note?: string }[];
  aliases?: string[];
  conventionalNames?: string[];
  pronunciation?: {
    recording?: Recording;
    // Explicit text only: isolated letters and placeholders are not safe TTS input.
    speech?: { text: string; label: string; lang?: string };
  };
  // Rules are knowledge, not arbitrary quiz prompts. The engine reverses this mapping.
  rulePrompt?: string;
  ruleAnswer?: string;
  ruleChoices?: string[];
  obsolete?: boolean;
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  phase: string;
  items: string[];
  note: string;
}

export interface Course {
  id: CourseId;
  type: 'script' | 'phonetics';
  title: string;
  scriptName: string;
  scriptClass: string;
  direction: 'ltr' | 'rtl';
  locale?: string;
  englishTitle: string;
  iconGlyph: string;
  notationNote: string;
  officialRomanizationName?: string;
  romanizationName?: string;
  ipaNote?: string;
  referenceNotes?: string[];
  pronunciationReference?: string;
  scriptVariants?: { id: string; label: string; className: string }[];
  composition?: { vowelIds: string[]; excludedConsonantIds: string[] };
  nativeTitle: string;
  label: string;
  description: string;
  units: Unit[];
  items: Knowledge[];
  sources: Source[];
}

export type ExerciseKind = 'intro' | 'read' | 'reverse' | 'match' | 'type' | 'meaning' | 'combine';
export interface Option { id: string; label: string; sublabel?: string }
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  itemId: string;
  prompt: string;
  display: string;
  options: Option[];
  answer: string;
  pairs?: { id: string; left: string; right: string }[];
  combination?: { glyph: string; roman: string; ipa: string; parts: string[] };
  repair?: boolean;
}

export interface StoredCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  learning_steps: number;
  last_review?: string;
}
export interface ItemProgress {
  introduced: boolean;
  correct: number;
  wrong: number;
  modes: string[];
  lastSeen: string;
  card?: StoredCard;
}
export interface Outcome { correct: number; wrong: number; hinted: boolean; modes: string[] }
export interface Session {
  id: string;
  courseId: CourseId;
  mode: 'learn' | 'review' | 'mistakes' | 'custom';
  unitId?: string;
  queue: Exercise[];
  index: number;
  outcomes: Record<string, Outcome>;
  introduced: string[];
  answers: number;
  correct: number;
  startedAt: string;
  activeSeconds: number;
  repairCount: Record<string, number>;
  newIds: string[];
}
export interface History {
  id: string;
  courseId: CourseId;
  date: string;
  answers: number;
  correct: number;
  newCount: number;
  minutes: number;
}
export interface AppState {
  version: 1;
  courseId: CourseId;
  progress: Record<string, ItemProgress>;
  history: History[];
  settings: { dailyGoal: number; newPerLesson: number; typing: boolean };
  session?: Session;
}
