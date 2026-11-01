import type { AppState, Course, Knowledge } from '../types';

export const itemLanguageIds = (course: Course, item: Knowledge): string[] =>
  item.languageIds || (course.mainLanguageId ? [course.mainLanguageId] : []);

export const selectedLanguages = (course: Course, state: AppState): string[] =>
  state.languageSelections?.[course.id] ?? course.languages?.map(language => language.id) ?? [];

export const matchesLanguages = (course: Course, item: Knowledge, selection: string[]): boolean =>
  !course.languages?.length || itemLanguageIds(course, item).some(id => selection.includes(id));

export const itemLanguage = (course: Course, item: Knowledge) =>
  course.languages?.find(language => language.id === itemLanguageIds(course, item)[0]);

export const itemLocale = (course: Course, item: Knowledge) => itemLanguage(course, item)?.locale || course.locale;
export const itemLanguageLabel = (course: Course, item: Knowledge) => course.languages
  ?.filter(language => itemLanguageIds(course, item).includes(language.id)).map(language => language.label).join(' · ');
// Badges distinguish readings, not scripts. Shared knowledge needs no badge,
// even when the current library or Rush selection includes only one language.
export const contrastLanguageLabel = (course: Course, item: Knowledge): string => {
  const languages = course.languages || [];
  if (languages.length < 2 || languages.every(language => itemLanguageIds(course, item).includes(language.id))) return '';
  return itemLanguageLabel(course, item) || '';
};
export const romanizationName = (course: Course, item: Knowledge) =>
  itemLanguage(course, item)?.romanizationName || course.romanizationName;

export function rushScoreKey(course: Course, mode: string, selection: string[]): string {
  const all = course.languages?.map(language => language.id) || [];
  const ids = all.filter(id => selection.includes(id)).sort();
  return `${course.id}:${mode}${all.length && ids.length !== all.length ? `:${ids.join('+') || 'none'}` : ''}`;
}
