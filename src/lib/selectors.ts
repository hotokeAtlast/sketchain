import type { ContractInfo, FnMember, VarMember } from "./parseSolidity"

export const fnsOf = (c: ContractInfo): FnMember[] =>
  c.members.filter((m): m is FnMember => m.kind === "function" && !m.removed)

export const varsOf = (c: ContractInfo): VarMember[] =>
  c.members.filter((m): m is VarMember => m.kind === "variable" && !m.removed)

export const eventsOf = (c: ContractInfo) =>
  c.members.filter((m) => m.kind === "event" && !m.removed)
