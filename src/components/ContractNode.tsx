import { Handle, Position } from "reactflow"
import type { ContractInfo } from "../lib/parseSolidity"

const kindColor: Record<string, string> = {
  interface: "bg-purple-100 text-purple-700",
  library: "bg-amber-100 text-amber-700",
  abstract: "bg-slate-100 text-slate-600",
  contract: "bg-blue-100 text-blue-700",
}

export default function ContractNode({
  data,
}: {
  data: { contract: ContractInfo }
}) {
  const c = data.contract
  return (
    <div className="w-64 rounded-xl border border-slate-200 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="font-semibold text-slate-800 truncate">{c.name}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
            kindColor[c.kind] ?? "bg-slate-100"
          }`}
        >
          {c.kind}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 flex gap-3">
        <span>ƒ {c.functions.length}</span>
        <span>◇ {c.variables.length}</span>
        <span>⚡ {c.events.length}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  )
}
