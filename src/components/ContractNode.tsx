import { Handle, Position } from "reactflow"
import type { ContractNodeData } from "../lib/astToGraph"

const kindColor: Record<string, string> = {
  interface: "bg-purple-100 text-purple-700",
  library: "bg-amber-100 text-amber-700",
  abstract: "bg-slate-100 text-slate-600",
  contract: "bg-blue-100 text-blue-700",
}

export default function ContractNode({ data }: { data: ContractNodeData }) {
  return (
    <div className="w-64 rounded-xl border border-slate-200 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="font-semibold text-slate-800 truncate">
          {data.label}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
            kindColor[data.kind] ?? "bg-slate-100"
          }`}
        >
          {data.kind}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 flex gap-3">
        <span>{"\u0192"} {data.fnCount}</span>
        <span>{"\u25C7"} {data.varCount}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  )
}
