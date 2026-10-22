import type { Course } from '../types';

export const learningPolicy = {
  unitReviewTarget: 36,
  unitReviewMax: 50,
  unitReviewRepairReserve: 6,
  ruleReviewGapDays: 14,
  ruleReviewLimit: 2,
} as const;

// Every mainline word has an explicit final destination, even if unlocked earlier.
export function prepareCourse(course: Course): Course {
  const assigned = new Set(course.units.flatMap(unit => unit.items));
  const remaining = course.items.filter(item => item.kind === 'word' && !item.extra && !assigned.has(item.id));
  const units = remaining.length ? [...course.units, {
    id: `${course.id}-supplement`, title: '主线词汇补充', subtitle: '集中补齐尚未练习的街景词汇',
    phase: '06 · 主线收尾', supplementary: true, items: remaining.map(item => item.id),
    note: '已在前面练过的词直接跳过。剩余词汇集中分批学习，最后完成综合复习。',
  }] : course.units;
  const items = new Map(course.items.map(item => [item.id, item]));
  for (const unit of [...units, ...(course.extraUnits || [])]) {
    const practical = unit.items.filter(id => items.get(id)?.kind !== 'rule').length;
    const ruleChecks = Math.min(learningPolicy.ruleReviewLimit, unit.items.length - practical);
    // Even an all-homophone unit must fit without relying on matching compression.
    if (practical + ruleChecks > learningPolicy.unitReviewMax - learningPolicy.unitReviewRepairReserve) {
      throw new Error(`${course.id}/${unit.id}: split this unit to leave room within the 50-question review limit.`);
    }
  }
  return { ...course, units };
}
