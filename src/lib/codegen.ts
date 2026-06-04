import type { ContractInfo, FnInfo, ParseResult } from "./parseSolidity"

function fnToSol(f: FnInfo): string {
  const head =
    f.kind === "constructor"
      ? "constructor"
      : f.kind === "fallback"
        ? "fallback"
        : f.kind === "receive"
          ? "receive"
          : `function ${f.name}`
  const sig = [
    `${head}(${f.params.join(", ")})`,
    f.kind === "function" ? f.visibility : "",
    f.stateMutability,
    ...f.modifiers,
    f.returns.length ? `returns (${f.returns.join(", ")})` : "",
  ]
    .filter(Boolean)
    .join(" ")
  if (f.body === null) return `    ${sig};`
  const body = f.body.replace(/^\n+|\s+$/g, "")
  return `    ${sig} {\n${body}\n    }`
}

export function contractToSol(c: ContractInfo): string {
  const kw = c.kind === "abstract" ? "abstract contract" : c.kind
  const header = `${kw} ${c.name}${c.bases.length ? " is " + c.bases.join(", ") : ""} {`
  const members: string[] = []
  for (const v of c.variables)
    members.push(
      `    ${v.type}${v.visibility ? " " + v.visibility : ""} ${v.name};`,
    )
  for (const e of c.events)
    members.push(`    event ${e.name}(${e.params.join(", ")});`)
  for (const f of c.functions) members.push(fnToSol(f))
  return `${header}\n${members.join("\n\n")}\n}`
}

export function modelToSolidity(p: ParseResult): string {
  return `${p.header.trimEnd()}\n\n${p.contracts.map(contractToSol).join("\n\n")}\n`
}
