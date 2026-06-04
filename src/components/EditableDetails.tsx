import { useState } from "react"
import type { ReactNode } from "react"
import type {
  ContractInfo,
  Member,
  ParamInfo,
} from "../lib/parseSolidity"
import { fnsOf, varsOf } from "../lib/selectors"

const VIS = ["public", "external", "internal", "private"]
const MUT = ["nonpayable", "view", "pure", "payable"]

type MemberPatch = {
  type?: string
  name?: string
  visibility?: string
  stateMutability?: string
  params?: ParamInfo[]
  returns?: ParamInfo[]
  initializer?: string | null
}

export default function EditableDetails({
  contract,
  onApply,
}: {
  contract: ContractInfo | null
  onApply: (c: ContractInfo) => void
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
  const d = draft

  const patch = (id: string, p: MemberPatch) =>
    setDraft({
      ...d,
      members: d.members.map((m) =>
        m.id === id ? { ...m, ...p, dirty: true } : m,
      ),
    })
  const remove = (id: string) =>
    setDraft({
      ...d,
      members: d.members.map((m) =>
        m.id === id ? { ...m, removed: true, dirty: true } : m,
      ),
    })
  const add = (m: Member) => setDraft({ ...d, members: [...d.members, m] })

  return (
    <div className="p-4 space-y-4 text-sm overflow-auto">
      <input
        className="w-full rounded border px-2 py-1 font-semibold"
        value={d.name}
        onChange={(e) =>
          setDraft({ ...d, name: e.target.value, headerDirty: true })
        }
      />

      <Section title="State variables">
        {varsOf(d).map((v) => (
          <div key={v.id} className="flex gap-1">
            <input
              className="w-28 rounded border px-1 text-xs font-mono"
              value={v.type}
              onChange={(e) => patch(v.id, { type: e.target.value })}
            />
            <input
              className="flex-1 rounded border px-1 text-xs"
              value={v.name}
              onChange={(e) => patch(v.id, { name: e.target.value })}
            />
            <input
              className="w-24 rounded border px-1 text-xs text-slate-500"
              placeholder="= init"
              value={v.initializer ?? ""}
              onChange={(e) =>
                patch(v.id, { initializer: e.target.value || null })
              }
            />
            <button className="text-red-400" onClick={() => remove(v.id)}>
              {"\u00D7"}
            </button>
          </div>
        ))}
        <button
          className="text-xs text-blue-500"
          onClick={() =>
            add({
              id: `new#${Date.now()}`,
              kind: "variable",
              raw: "",
              dirty: true,
              type: "uint256",
              name: "newVar",
              visibility: "public",
              initializer: null,
            })
          }
        >
          + add variable
        </button>
      </Section>

      <Section title="Functions">
        {fnsOf(d).map((f) => (
          <div key={f.id} className="space-y-1 rounded border border-slate-200 p-2">
            <div className="flex items-center gap-1">
              <input
                className="flex-1 rounded border px-1 font-mono text-xs"
                value={f.name}
                onChange={(e) => patch(f.id, { name: e.target.value })}
              />
              <select
                className="rounded border text-xs"
                value={f.visibility ?? "public"}
                onChange={(e) => patch(f.id, { visibility: e.target.value })}
              >
                {VIS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                className="rounded border text-xs"
                value={f.stateMutability ?? "nonpayable"}
                onChange={(e) =>
                  patch(f.id, { stateMutability: e.target.value })
                }
              >
                {MUT.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <button className="text-red-400" onClick={() => remove(f.id)}>
                {"\u00D7"}
              </button>
            </div>
            <ParamEditor
              label="params"
              items={f.params}
              onChange={(ps) => patch(f.id, { params: ps })}
            />
            <ParamEditor
              label="returns"
              items={f.returns}
              onChange={(ps) => patch(f.id, { returns: ps })}
            />
          </div>
        ))}
        <button
          className="text-xs text-blue-500"
          onClick={() =>
            add({
              id: `new#${Date.now()}`,
              kind: "function",
              fnKind: "function",
              raw: "",
              dirty: true,
              name: "newFunction",
              visibility: "public",
              stateMutability: "nonpayable",
              params: [],
              returns: [],
              modifiers: [],
              body: "        // TODO",
            })
          }
        >
          + add function
        </button>
      </Section>

      <button
        onClick={() => onApply(d)}
        className="w-full rounded-lg bg-blue-600 py-2 text-white text-sm hover:bg-blue-700"
      >
        Apply to code {"\u2192"}
      </button>
    </div>
  )
}

function ParamEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: ParamInfo[]
  onChange: (ps: ParamInfo[]) => void
}) {
  const set = (i: number, p: Partial<ParamInfo>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...p } : it)))
  return (
    <div className="pl-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      {items.map((p, i) => (
        <div key={i} className="flex gap-1">
          <input
            className="w-24 rounded border px-1 text-xs font-mono"
            placeholder="type"
            value={p.type}
            onChange={(e) => set(i, { type: e.target.value })}
          />
          <input
            className="w-20 rounded border px-1 text-xs text-slate-500"
            placeholder="memory"
            value={p.storage ?? ""}
            onChange={(e) => set(i, { storage: e.target.value || undefined })}
          />
          <input
            className="flex-1 rounded border px-1 text-xs"
            placeholder="name"
            value={p.name}
            onChange={(e) => set(i, { name: e.target.value })}
          />
          <button
            className="text-red-400"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            {"\u00D7"}
          </button>
        </div>
      ))}
      <button
        className="text-[11px] text-blue-500"
        onClick={() => onChange([...items, { type: "uint256", name: "" }])}
      >
        + {label.slice(0, -1)}
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
