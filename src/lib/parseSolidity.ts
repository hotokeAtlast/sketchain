import * as parser from "@solidity-parser/parser"

export type FnInfo = {
  name: string
  kind: "function" | "constructor" | "fallback" | "receive"
  visibility?: string
  stateMutability?: string
  params: string[]
  returns: string[]
  modifiers: string[]
  body: string | null
}
export type VarInfo = { name: string; type: string; visibility?: string }
export type EventInfo = { name: string; params: string[] }
export type ContractInfo = {
  name: string
  kind: string
  bases: string[]
  functions: FnInfo[]
  variables: VarInfo[]
  events: EventInfo[]
  modifiers: string[]
}
export type ParseResult = { header: string; contracts: ContractInfo[]; errors: string[] }

type Range = [number, number]
type AstNode = { type: string; range?: Range }
type TypeNameNode = AstNode & {
  name?: string
  namePath?: string
  baseTypeName?: TypeNameNode
  keyType?: TypeNameNode
  valueType?: TypeNameNode
}
type VariableNode = AstNode & {
  typeName?: TypeNameNode | null
  name: string | null
  visibility?: string
}
type FunctionDefNode = AstNode & {
  name: string | null
  parameters?: VariableNode[]
  returnParameters?: VariableNode[]
  modifiers?: Array<AstNode & { name: string }>
  stateMutability?: string
  visibility?: string
  isConstructor?: boolean
  isReceiveEther?: boolean
  isFallback?: boolean
  body?: (AstNode & { range?: Range }) | null
}
type StateVarDeclNode = AstNode & { variables?: VariableNode[] }
type EventDefNode = AstNode & {
  name: string
  parameters?: VariableNode[]
}
type ModifierDefNode = AstNode & { name: string }
type ContractDefNode = AstNode & {
  name: string
  kind: string
  range?: Range
  baseContracts?: Array<AstNode & { baseName: { namePath: string } }>
  subNodes?: Array<
    | FunctionDefNode
    | StateVarDeclNode
    | EventDefNode
    | ModifierDefNode
    | AstNode
  >
}
type SourceUnitNode = AstNode & {
  children?: ContractDefNode[]
  errors?: Array<{ message: string }>
}

function typeToString(t: TypeNameNode | null | undefined): string {
  if (!t) return ""
  switch (t.type) {
    case "ElementaryTypeName":
      return t.name ?? ""
    case "UserDefinedTypeName":
      return t.namePath ?? ""
    case "ArrayTypeName":
      return `${typeToString(t.baseTypeName)}[]`
    case "Mapping":
      return `mapping(${typeToString(t.keyType)} => ${typeToString(t.valueType)})`
    case "FunctionTypeName":
      return "function"
    default:
      return t.name ?? t.namePath ?? ""
  }
}

const paramList = (ps: VariableNode[] | undefined): string[] =>
  (ps ?? []).map(
    (p) => `${typeToString(p.typeName)}${p.name ? " " + p.name : ""}`.trim(),
  )

export function parseSolidity(code: string): ParseResult {
  const errors: string[] = []
  let ast: SourceUnitNode
  try {
    ast = parser.parse(code, { tolerant: true, range: true }) as SourceUnitNode
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { header: "", contracts: [], errors: [message] }
  }
  if (ast.errors?.length) {
    for (const er of ast.errors) errors.push(er.message)
  }

  const contractNodes = (ast.children ?? []).filter(
    (n) => n.type === "ContractDefinition",
  )
  const header =
    contractNodes.length && contractNodes[0].range
      ? code.slice(0, contractNodes[0].range[0])
      : code

  const contracts: ContractInfo[] = contractNodes.map((node) => {
    const c: ContractInfo = {
      name: node.name,
      kind: node.kind,
      bases: (node.baseContracts ?? []).map((b) => b.baseName.namePath),
      functions: [],
      variables: [],
      events: [],
      modifiers: [],
    }
    for (const sub of node.subNodes ?? []) {
      if (sub.type === "FunctionDefinition") {
        const f = sub as FunctionDefNode
        const kind: FnInfo["kind"] = f.isConstructor
          ? "constructor"
          : f.isReceiveEther
            ? "receive"
            : f.isFallback
              ? "fallback"
              : "function"
        const body =
          f.body && f.body.range
            ? code.slice(f.body.range[0] + 1, f.body.range[1])
            : null
        c.functions.push({
          name: f.name || kind,
          kind,
          visibility: f.visibility,
          stateMutability: f.stateMutability,
          params: paramList(f.parameters),
          returns: paramList(f.returnParameters),
          modifiers: (f.modifiers ?? []).map((m) => m.name),
          body,
        })
      } else if (sub.type === "StateVariableDeclaration") {
        const s = sub as StateVarDeclNode
        for (const v of s.variables ?? [])
          c.variables.push({
            name: v.name ?? "",
            type: typeToString(v.typeName),
            visibility: v.visibility,
          })
      } else if (sub.type === "EventDefinition") {
        const e = sub as EventDefNode
        c.events.push({ name: e.name, params: paramList(e.parameters) })
      } else if (sub.type === "ModifierDefinition") {
        const m = sub as ModifierDefNode
        c.modifiers.push(m.name)
      }
    }
    return c
  })
  return { header, contracts, errors }
}
