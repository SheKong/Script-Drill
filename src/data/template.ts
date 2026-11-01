import type { Course } from '../types';

export const learningPolicy = {
  unitReviewTarget: 36,
  unitReviewMax: 50,
  unitReviewRepairReserve: 6,
  ruleReviewGapDays: 14,
  ruleReviewLimit: 2,
  placeLessonMin: 8,
  placeLessonMax: 12,
} as const;

// Every mainline word has an explicit final destination, even if unlocked earlier.
export function prepareCourse(course: Course): Course {
  const languageIds = new Set(course.languages?.map(language => language.id));
  const branchIds = new Set(course.branches?.map(branch => branch.id));
  if (course.languages?.length) {
    if (languageIds.size !== course.languages.length || !languageIds.has(course.mainLanguageId || '')) {
      throw new Error(`${course.id}: languages need unique IDs and a registered main language.`);
    }
    for (const language of course.languages) {
      if (!course.sources.some(source => source.id === language.romanizationSource)) {
        throw new Error(`${course.id}/${language.id}: missing romanization source.`);
      }
    }
  }
  if (branchIds.size !== (course.branches?.length || 0)) throw new Error(`${course.id}: duplicate branch IDs.`);
  for (const branch of course.branches || []) {
    if (!languageIds.has(branch.languageId) || !branch.units.length) throw new Error(`${branch.id}: invalid branch language or units.`);
  }
  for (const item of course.items) {
    if (item.branchId && (!branchIds.has(item.branchId) || item.extra)) throw new Error(`${item.id}: invalid branch membership.`);
    if (item.languageIds && (!item.languageIds.length || item.languageIds.some(id => !languageIds.has(id)))) {
      throw new Error(`${item.id}: invalid language membership.`);
    }
  }
  if (course.type === 'script') {
    if (!course.romanizationName || !course.romanizationSource
      || !course.sources.some(source => source.id === course.romanizationSource)) {
      throw new Error(`${course.id}: script courses need one named standard romanization and its source.`);
    }
    for (const item of course.items) {
      if (['consonant', 'vowel'].includes(item.kind) && !item.ipa) {
        throw new Error(`${item.id}: teach the standard romanization together with IPA.`);
      }
      if (item.officialRoman !== undefined && item.officialRoman !== item.roman) {
        throw new Error(`${item.id}: roman must be the standard romanization, not a separate teaching notation.`);
      }
    }
  }
  const assigned = new Set(course.units.flatMap(unit => unit.items));
  const remaining = course.items.filter(item => item.kind === 'word' && !item.extra && !item.branchId && !assigned.has(item.id));
  const units = remaining.length ? [...course.units, {
    id: `${course.id}-supplement`, title: '主线词汇补充', subtitle: '集中补齐尚未练习的街景词汇',
    phase: '06 · 主线收尾', supplementary: true, items: remaining.map(item => item.id),
    note: '已在前面练过的词直接跳过。剩余词汇集中分批学习，最后完成综合复习。',
  }] : course.units;
  const items = new Map(course.items.map(item => [item.id, item]));
  const allUnits = [...units, ...(course.extraUnits || []), ...(course.branches || []).flatMap(branch => branch.units)];
  if (new Set(allUnits.map(unit => unit.id)).size !== allUnits.length) throw new Error(`${course.id}: duplicate unit IDs.`);
  for (const unit of allUnits) {
    if (unit.items.some(id => !items.has(id))) throw new Error(`${unit.id}: unknown knowledge ID.`);
    if ((unit.placeLesson || course.extraUnits?.includes(unit)) && (unit.items.length < learningPolicy.placeLessonMin || unit.items.length > learningPolicy.placeLessonMax
      || unit.items.some(id => items.get(id)?.kind !== 'word' || !items.get(id)?.place))) {
      throw new Error(`${unit.id}: place lessons need 8-12 mapped place names (target 10).`);
    }
    const practical = unit.items.filter(id => items.get(id)?.kind !== 'rule').length;
    const ruleChecks = Math.min(learningPolicy.ruleReviewLimit, unit.items.length - practical);
    // Even an all-homophone unit must fit without relying on matching compression.
    if (practical + ruleChecks > learningPolicy.unitReviewMax - learningPolicy.unitReviewRepairReserve) {
      throw new Error(`${course.id}/${unit.id}: split this unit to leave room within the 50-question review limit.`);
    }
  }
  for (const branch of course.branches || []) {
    const assigned = branch.units.flatMap(unit => unit.items);
    if (new Set(assigned).size !== assigned.length
      || course.items.some(item => item.branchId === branch.id && !assigned.includes(item.id))) {
      throw new Error(`${branch.id}: every branch item needs exactly one unit.`);
    }
    for (const unit of branch.units) for (const id of unit.items) {
      if (items.get(id)?.branchId !== branch.id) throw new Error(`${id}: branch unit membership mismatch.`);
      if (!items.get(id)?.languageIds?.includes(branch.languageId)) throw new Error(`${id}: branch language mismatch.`);
      for (const prerequisite of items.get(id)!.requires) {
        if (!items.has(prerequisite)) throw new Error(`${id}: unknown prerequisite.`);
        const owner = items.get(prerequisite)!.branchId;
        if (owner && (owner !== branch.id || assigned.indexOf(prerequisite) >= assigned.indexOf(id))) {
          throw new Error(`${id}: branch prerequisites must precede their targets within this branch.`);
        }
      }
    }
  }
  if (units.some(unit => unit.items.some(id => items.get(id)?.branchId))) throw new Error(`${course.id}: branch knowledge cannot be a mainline target.`);
  return { ...course, units };
}
