import type { Node, Edge } from "reactflow"
import type { ContractInfo } from "./parseSolidity"

type ContractNodeData = { contract: ContractInfo }

export function astToGraph(contracts: ContractInfo[]): {
  nodes: Node<ContractNodeData>[]
  edges: Edge[]
} {
  const nodes: Node<ContractNodeData>[] = contracts.map((c, i) => ({
    id: c.name,
    type: "contract",
    position: { x: (i % 3) * 320, y: Math.floor(i / 3) * 260 },
    data: { contract: c },
  }))

  const names = new Set(contracts.map((c) => c.name))
  const edges: Edge[] = []
  for (const c of contracts) {
    for (const base of c.bases) {
      if (!names.has(base)) continue
      edges.push({
        id: `${base}->${c.name}`,
        source: base,
        target: c.name,
        label: "inherits",
        animated: true,
      })
    }
  }
  return { nodes, edges }
}
