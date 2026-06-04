import * as parser from "@solidity-parser/parser"

export type ParamInfo = { type: string; name: string; storage?: string }
type Base = { id: string; raw: string; dirty?: boolean; removed?: boolean }

export type FnMember = Base & {
  kind: "function"
  fnKind: "function" | "constructor" | "fallback" | "receive"
  name: string
  visibility?: string
  stateMutability?: string
  params: ParamInfo[]
  returns: ParamInfo[]
  modifiers: string[]
  body: string | null
}
export type VarMember = Base & {
  kind: "variable"
  name: string
  type: string
  visibility?: string
  initializer: string | null
}
export type OtherMember = Base & {
  kind: "event" | "modifier" | "struct" | "enum" | "error" | "using" | "other"
  name?: string
}
export type Member = FnMember | VarMember | OtherMember

export type ContractInfo = {
  name: string
  kind: string
  bases: string[]
  members: Member[]
  raw: string
  headerDirty?: boolean
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
  storageLocation?: string | null
  expression?: (AstNode & { range?: Range }) | null
}
type ModifierInvocationNode = AstNode & { name: string }
type FunctionDefNode = AstNode & {
  name: string | null
  parameters?: VariableNode[]
  returnParameters?: VariableNode[]
  modifiers?: ModifierInvocationNode[]
  stateMutability?: string
  visibility?: string
  isConstructor?: boolean
  isReceiveEther?: boolean
  isFallback?: boolean
  body?: (AstNode & { range?: Range }) | null
}
type StateVarDeclNode = AstNode & {
  variables?: VariableNode[]
}
type EventDefNode = AstNode & {
  name: string
  parameters?: VariableNode[]
}
type ModifierDefNode = AstNode & { name: string }
type StructDefNode = AstNode & { name: string }
type EnumDefNode = AstNode & { name: string }
type CustomErrorDefNode = AstNode & { name: string }
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
    | StructDefNode
    | EnumDefNode
    | CustomErrorDefNode
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

const toParams = (ps: VariableNode[] | undefined): ParamInfo[] =>
  (ps ?? []).map((p) => ({
    type: typeToString(p.typeName),
    name: p.name ?? "",
    storage: p.storageLocation || undefined,
  }))

const lineStartOf = (code: string, idx: number): number => {
  const nl = code.lastIndexOf("\n", idx - 1)
  return nl === -1 ? 0 : nl + 1
}

function withLeadingComments(code: string, start: number): number {
  let s = start
  while (s > 0) {
    const prev = lineStartOf(code, s - 1)
    const line = code.slice(prev, s - 1).trim()
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*"))
      s = prev
    else break
  }
  return s
}

const rawStart = (code: string, node: AstNode): number => {
  if (!node.range) return 0
  return withLeadingComments(code, lineStartOf(code, node.range[0]))
}

function rawSlice(code: string, node: AstNode): string {
  if (!node.range) return ""
  const start = rawStart(code, node)
  let end = node.range[1] + 1
  while (end < code.length && /[ \t]/.test(code[end])) end++
  if (code[end] === ";") end++
  return code.slice(start, end).replace(/[ \t]+$/, "")
}

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

  const nodes = (ast.children ?? []).filter(
    (n) => n.type === "ContractDefinition",
  )
  const header = nodes.length
    ? code.slice(0, rawStart(code, nodes[0]))
    : code

  const contracts: ContractInfo[] = nodes.map((node) => {
    let i = 0
    const members: Member[] = []
    for (const sub of node.subNodes ?? []) {
      const id = `${node.name}#${i++}`
      const raw = rawSlice(code, sub)
      if (sub.type === "FunctionDefinition") {
        const f = sub as FunctionDefNode
        const fnKind: FnMember["fnKind"] = f.isConstructor
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
        members.push({
          id,
          kind: "function",
          fnKind,
          raw,
          name: f.name || fnKind,
          visibility: f.visibility,
          stateMutability: f.stateMutability,
          params: toParams(f.parameters),
          returns: toParams(f.returnParameters),
          modifiers: (f.modifiers ?? []).map((m) => m.name),
          body,
        })
      } else if (sub.type === "StateVariableDeclaration") {
        const s = sub as StateVarDeclNode
        const v = s.variables?.[0]
        const initializer =
          v?.expression && v.expression.range
            ? code.slice(v.expression.range[0], v.expression.range[1] + 1)
            : null
        members.push({
          id,
          kind: "variable",
          raw,
          name: v?.name ?? "",
          type: typeToString(v?.typeName),
          visibility: v?.visibility,
          initializer,
        })
      } else if (sub.type === "EventDefinition") {
        members.push({ id, kind: "event", raw, name: (sub as EventDefNode).name })
      } else if (sub.type === "ModifierDefinition") {
        members.push({ id, kind: "modifier", raw, name: (sub as ModifierDefNode).name })
      } else if (sub.type === "StructDefinition") {
        members.push({ id, kind: "struct", raw, name: (sub as StructDefNode).name })
      } else if (sub.type === "EnumDefinition") {
        members.push({ id, kind: "enum", raw, name: (sub as EnumDefNode).name })
      } else if (sub.type === "CustomErrorDefinition") {
        members.push({ id, kind: "error", raw, name: (sub as CustomErrorDefNode).name })
      } else {
        members.push({ id, kind: "other", raw })
      }
    }
    return {
      name: node.name,
      kind: node.kind,
      bases: (node.baseContracts ?? []).map((b) => b.baseName.namePath),
      members,
      raw: rawSlice(code, node),
    }
  })
  return { header, contracts, errors }
}
