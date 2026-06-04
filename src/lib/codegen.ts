import type {
  ContractInfo,
  FnMember,
  Member,
  ParamInfo,
  ParseResult,
  VarMember,
} from "./parseSolidity"

const param = (p: ParamInfo): string =>
  [p.type, p.storage, p.name].filter(Boolean).join(" ")

function fnToSol(f: FnMember): string {
  const head =
    f.fnKind === "constructor"
      ? "constructor"
      : f.fnKind === "fallback"
        ? "fallback"
        : f.fnKind === "receive"
          ? "receive"
          : `function ${f.name}`
  const sig = [
    `${head}(${f.params.map(param).join(", ")})`,
    f.fnKind === "function" ? f.visibility : "",
    f.stateMutability && f.stateMutability !== "nonpayable"
      ? f.stateMutability
      : "",
    ...f.modifiers,
    f.returns.length ? `returns (${f.returns.map(param).join(", ")})` : "",
  ]
    .filter(Boolean)
    .join(" ")
  if (f.body === null) return `    ${sig};`
  return `    ${sig} {\n${f.body.replace(/^\n+|\s+$/g, "")}\n    }`
}

function varToSol(v: VarMember): string {
  const decl = [v.type, v.visibility, v.name].filter(Boolean).join(" ")
  return `    ${decl}${v.initializer != null ? " = " + v.initializer.trim() : ""};`
}

function memberToSol(m: Member): string | null {
  if (m.removed) return null
  if (!m.dirty) return m.raw
  if (m.kind === "function") return fnToSol(m)
  if (m.kind === "variable") return varToSol(m)
  return m.raw
}

const isClean = (c: ContractInfo): boolean =>
  !c.headerDirty && c.members.every((m) => !m.dirty && !m.removed)

export function contractToSol(c: ContractInfo): string {
  if (isClean(c)) return c.raw
  const kw = c.kind === "abstract" ? "abstract contract" : c.kind
  const header = `${kw} ${c.name}${c.bases.length ? " is " + c.bases.join(", ") : ""} {`
  const body = c.members
    .map(memberToSol)
    .filter((s): s is string => s !== null)
    .join("\n\n")
  return `${header}\n${body}\n}`
}

export function modelToSolidity(p: ParseResult): string {
  return `${p.header.trimEnd()}\n\n${p.contracts.map(contractToSol).join("\n\n")}\n`
}
