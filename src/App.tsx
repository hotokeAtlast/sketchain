import { useEffect, useMemo, useState } from "react"
import CodePane from "./components/CodePane"
import CanvasPane from "./components/CanvasPane"
import EditableDetails from "./components/EditableDetails"
import FileUpload from "./components/FileUpload"
import FileTabs from "./components/FileTabs"
import Palette from "./components/Palette"
import { parseSolidity, type ContractInfo, type ParseResult } from "./lib/parseSolidity"
import { astToGraph } from "./lib/astToGraph"
import { modelToSolidity } from "./lib/codegen"
import { SAMPLE } from "./sample"

export default function App() {
  const [files, setFiles] = useState<Record<string, string>>({
    "untitled.sol": SAMPLE,
  })
  const [active, setActive] = useState("untitled.sol")
  const [parsed, setParsed] = useState<ParseResult>({
    header: "",
    contracts: [],
    errors: [],
  })
  const [selected, setSelected] = useState<ContractInfo | null>(null)

  const code = files[active] ?? ""
  const setCode = (v: string) => setFiles((f) => ({ ...f, [active]: v }))

  useEffect(() => {
    const t = setTimeout(() => setParsed(parseSolidity(code)), 300)
    return () => clearTimeout(t)
  }, [code])

  const { nodes, edges } = useMemo(
    () => astToGraph(parsed.contracts),
    [parsed],
  )

  function applyContract(updated: ContractInfo) {
    const next = {
      ...parsed,
      contracts: parsed.contracts.map((c) => (c === selected ? updated : c)),
    }
    setParsed(next)
    setCode(modelToSolidity(next))
    setSelected(updated)
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center gap-3 px-4 border-b bg-white">
        <span className="font-semibold text-slate-800">Sketchain</span>
        <span className="text-xs text-slate-400">Visual {"\u21C4"} Code (M2)</span>
        <div className="ml-auto w-64">
          <FileUpload
            onLoad={(name, content) => {
              setFiles((f) => ({ ...f, [name]: content }))
              setActive(name)
            }}
          />
        </div>
      </header>

      <FileTabs
        files={Object.keys(files)}
        active={active}
        onPick={setActive}
        onClose={(name) =>
          setFiles((f) => {
            const rest = { ...f }
            delete rest[name]
            const keys = Object.keys(rest)
            if (name === active && keys[0]) setActive(keys[0])
            return rest
          })
        }
      />
      <Palette
        onInsert={(sol) => setCode(code.trimEnd() + "\n\n" + sol + "\n")}
      />

      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0">
        <div className="min-w-0 border-r">
          <CanvasPane nodes={nodes} edges={edges} onSelect={setSelected} />
        </div>
        <div className="grid grid-rows-[1fr_1fr] min-h-0">
          <div className="border-b overflow-auto">
            <EditableDetails contract={selected} onApply={applyContract} />
          </div>
          <CodePane value={code} onChange={setCode} />
        </div>
      </div>
    </div>
  )
}
