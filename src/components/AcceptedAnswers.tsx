import { acceptedTypedAnswers } from '../lib/engine';
import type { Knowledge } from '../types';

export function AcceptedAnswers({ item }: { item: Knowledge }) {
  const answers = acceptedTypedAnswers(item);
  if (!answers.length) return null;
  return <div className="accepted-answers">
    <span>可接受输入</span>
    <p dir="ltr">{answers.map((answer, index) => <span key={answer}>
      {index > 0 && ' / '}<bdi>{answer}</bdi>
    </span>)}</p>
  </div>;
}
