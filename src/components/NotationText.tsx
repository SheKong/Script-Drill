export function NotationText({ text }: { text: string }) {
  return text.split(/(\/[^/\n]+\/|\[[^\]\n]+\])/u).map((part, index) =>
    (/^(\/|\[)/u.test(part) && !/[\p{Script=Han}\p{Script=Thai}]/u.test(part))
      ? <span className="phonetic notation-run" key={index}>{part}</span> : part);
}
