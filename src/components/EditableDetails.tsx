import { useState } from "react"
import type { ReactNode } from "react"
import type { ContractInfo } from "../lib/parseSolidity"

export default function EditableDetails({
  contract,
  onApply,
}: {
  contract: ContractInfo | null
  onApply: (updated: ContractInfo) => void
}) {
  const [draft, setDraft] = useState<ContractInfo | null>(contract)
  const [prev, setPrev] = useState(contract)
  if (contract !== prev) {
    setPrev(contract)
    setDraft(contract)
  }
  if (!draft)
    return (
      <div className="p-4 text-sm text-slate-400">
        Select a contract to edit it.
      </div>
    )

  const set = (patch: Partial<ContractInfo>) =>
    setDraft({ ...draft, ...patch })

  return (
    <div className="p-4 space-y-4 text-sm overflow-auto">
      <input
        className="w-full rounded border px-2 py-1 font-semibold"
        value={draft.name}
        onChange={(e) => set({ name: e.target.value })}
      />

      <Section title="State variables">
        {draft.variables.map((v, i) => (
          <div key={i} className="flex gap-1">
            <input
              className="w-24 rounded border px-1 text-xs"
              value={v.type}
              onChange={(e) => {
                const vs = [...draft.variables]
                vs[i] = { ...v, type: e.target.value }
                set({ variables: vs })
              }}
            />
            <input
              className="flex-1 rounded border px-1 text-xs"
              value={v.name}
              onChange={(e) => {
                const vs = [...draft.variables]
                vs[i] = { ...v, name: e.target.value }
                set({ variables: vs })
              }}
            />
            <button
              className="text-red-400"
              onClick={() =>
                set({ variables: draft.variables.filter((_, j) => j !== i) })
              }
            >
              {"\u00D7"}
            </button>
          </div>
        ))}
        <button
          className="text-xs text-blue-500"
          onClick={() =>
            set({
              variables: [
                ...draft.variables,
                { type: "uint256", name: "newVar", visibility: "public" },
              ],
            })
          }
        >
          + add variable
        </button>
      </Section>

      <Section title="Functions">
        {draft.functions.map((f, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              className="flex-1 rounded border px-1 font-mono text-xs"
              value={f.name}
              onChange={(e) => {
                const fs = [...draft.functions]
                fs[i] = { ...f, name: e.target.value }
                set({ functions: fs })
              }}
            />
            <select
              className="rounded border text-xs"
              value={f.visibility ?? "public"}
              onChange={(e) => {
                const fs = [...draft.functions]
                fs[i] = { ...f, visibility: e.target.value }
                set({ functions: fs })
              }}
            >
              {["public", "external", "internal", "private"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <button
              className="text-red-400"
              onClick={() =>
                set({ functions: draft.functions.filter((_, j) => j !== i) })
              }
            >
              {"\u00D7"}
            </button>
          </div>
        ))}
        <button
          className="text-xs text-blue-500"
          onClick={() =>
            set({
              functions: [
                ...draft.functions,
                {
                  name: "newFunction",
                  kind: "function",
                  visibility: "public",
                  params: [],
                  returns: [],
                  modifiers: [],
                  body: "        // TODO",
                },
              ],
            })
          }
        >
          + add function
        </button>
      </Section>

      <button
        onClick={() => onApply(draft)}
        className="w-full rounded-lg bg-blue-600 py-2 text-white text-sm hover:bg-blue-700"
      >
        Apply to code {"\u2192"}
      </button>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  )
}
