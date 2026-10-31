import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

/**
 * One collapsible settings group. Groups stack flat inside their panel, separated by a line;
 * the summary shows the current value while collapsed.
 */
export function Accordion({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-line border-b last:border-b-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-raised/50"
        >
          <span className="font-medium text-sm">{title}</span>
          <span className="ml-auto min-w-0 truncate text-muted text-xs">{summary}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h2>
      {open && (
        <div id={id} className="space-y-4 px-5 pt-1 pb-5">
          {children}
        </div>
      )}
    </section>
  );
}
