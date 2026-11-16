import { cn } from "@quickadui/utils";
import { parseRichText } from "../rich-text";

/**
 * Description d'une expérience ou d'un projet : paragraphes, sous-titres
 * (ligne finissant par « : ») et puces (ligne commençant par -, • ou ▪).
 */
export function CvRichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <p key={index} className="mt-1 text-[0.72rem] font-semibold tracking-wide text-neutral-12 uppercase">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="flex flex-col gap-0.5 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-1.5">
                  <span aria-hidden className="mt-[0.55em] size-1 shrink-0 rounded-full bg-accent-9" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
