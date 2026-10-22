import type { Course } from '../types';

// Every mainline word has an explicit final destination, even if unlocked earlier.
export function prepareCourse(course: Course): Course {
  const assigned = new Set(course.units.flatMap(unit => unit.items));
  const remaining = course.items.filter(item => item.kind === 'word' && !item.extra && !assigned.has(item.id));
  if (!remaining.length) return course;
  return {
    ...course,
    units: [...course.units, {
      id: `${course.id}-supplement`, title: '主线词汇补充', subtitle: '集中补齐尚未练习的街景词汇',
      phase: '06 · 主线收尾', supplementary: true, items: remaining.map(item => item.id),
      note: '已在前面练过的词直接跳过。剩余词汇集中分批学习，最后完成综合复习。',
    }],
  };
}
