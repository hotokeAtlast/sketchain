import type { Node, Edge } from "reactflow"
import type { ContractInfo } from "./parseSolidity"
import { fnsOf, varsOf } from "./selectors"

export type ContractNodeData = {
  contract: ContractInfo
  label: string
  kind: string
  fnCount: number
  varCount: number
}

export function astToGraph(contracts: ContractInfo[]): {
  nodes: Node<ContractNodeData>[]
  edges: Edge[]
} {
  const nodes: Node<ContractNodeData>[] = contracts.map((c, i) => ({
    id: c.name,
    type: "contract",
    position: { x: (i % 3) * 320, y: Math.floor(i / 3) * 240 },
    data: {
      contract: c,
      label: c.name,
      kind: c.kind,
      fnCount: fnsOf(c).length,
      varCount: varsOf(c).length,
    },
  }))

  const names = new Set(contracts.map((c) => c.name))
  const edges: Edge[] = []
  for (const c of contracts) {
    for (const b of c.bases) {
      if (!names.has(b)) continue
      edges.push({
        id: `${c.name}-${b}`,
        source: b,
        target: c.name,
        label: "is",
      })
    }
  }
  return { nodes, edges }
}
