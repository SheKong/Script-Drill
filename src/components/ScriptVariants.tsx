import { useState } from 'react';
import type { Course } from '../types';

export function ScriptStyleControl({ course, value, onChange }: {
  course: Course; value: string; onChange: (id: string) => void;
}) {
  if (!course.scriptVariants?.length) return null;
  return <div className="script-style-control" role="group" aria-label="字形风格">
    {course.scriptVariants.map(variant => <button key={variant.id} type="button"
      aria-pressed={value === variant.id} onClick={() => onChange(variant.id)}>{variant.label}</button>)}
  </div>;
}

export function useScriptStyle(course: Course) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const variant = course.scriptVariants?.find(v => v.id === selected[course.id]) || course.scriptVariants?.[0];
  return {
    scriptClass: variant?.className || course.scriptClass,
    control: <ScriptStyleControl course={course} value={variant?.id || ''}
      onChange={id => setSelected(current => ({ ...current, [course.id]: id }))} />,
  };
}

export function ScriptComparison({ course, text }: { course: Course; text: string }) {
  if (!course.scriptVariants?.length) return null;
  return <div className="script-comparison" aria-label="字形对照">
    {course.scriptVariants.map(variant => <div key={variant.id}>
      <span>{variant.label}</span>
      <strong className={variant.className} dir={course.direction} lang={course.locale}>{text}</strong>
    </div>)}
  </div>;
}
