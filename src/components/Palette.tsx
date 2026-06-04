import { TEMPLATES } from "../lib/templates"

export default function Palette({
  onInsert,
}: {
  onInsert: (sol: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b bg-white p-2">
      <span className="text-xs text-slate-400 self-center">Insert:</span>
      {Object.entries(TEMPLATES).map(([label, sol]) => (
        <button
          key={label}
          onClick={() => onInsert(sol)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
        >
          + {label}
        </button>
      ))}
    </div>
  )
}
