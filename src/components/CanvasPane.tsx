import ReactFlow, { Background, Controls, MiniMap } from "reactflow"
import type { Node, Edge } from "reactflow"
import ContractNode from "./ContractNode"
import type { ContractInfo } from "../lib/parseSolidity"
import type { ContractNodeData } from "../lib/astToGraph"

const nodeTypes = { contract: ContractNode }

export default function CanvasPane({
  nodes,
  edges,
  onSelect,
}: {
  nodes: Node<ContractNodeData>[]
  edges: Edge[]
  onSelect: (c: ContractInfo) => void
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, n) => onSelect(n.data.contract)}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}
