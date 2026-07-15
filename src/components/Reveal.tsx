import { type ReactNode, type ElementType } from "react";
import { useReveal } from "@/hooks/useReveal";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
};

/**
 * Wrap any section/element to fade + slide in when scrolled into view.
 * Uses CSS transitions only — no animation library, minimal overhead.
 */
export function Reveal({ as: Tag = "div", children, className = "", delay = 0, id }: Props) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref as any}
      id={id}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
