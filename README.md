# Sketchain

> Code &harr; Visual for Solidity. Parse a `.sol` file, see your contracts as a graph, edit them visually, regenerate the source &mdash; without losing your formatting.

Sketchain is a single-page web app that turns a Solidity source file into an editable visual model. It is **client-side first**: no backend needed for M1/M2. M3 adds an Express backend (cron, scheduled chain reads, etc.) served from the same Node process that hosts the static app &mdash; one service, one URL.

## Features

- **Drop-in `.sol` upload** &mdash; drag-drop or picker, multi-file, tabbed
- **Live graph** &mdash; contracts as cards, inheritance as edges, pan/zoom/minimap
- **Editable details panel** &mdash; rename, add/remove state vars &amp; functions, change visibility/state-mutability/params/returns, set initializers
- **Loss-free round-trip** &mdash; untouched code (comments, NatSpec, initializers, structs, enums, errors, `using`, modifier bodies) is preserved **byte-for-byte**. Only members you actually edit are regenerated.
- **Standard-block palette** &mdash; one-click insert Ownable, ERC-20, Pausable scaffolds
- **Hot-swap code &harr; graph** &mdash; parse on every keystroke; edits in the panel regen the source
- **Express backend (M3)** &mdash; `/api/health`, `/api/cron/external`, `node-cron` scheduled jobs, all in the same process

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Client shell | Vite + React 19 + TypeScript (npm workspaces)       |
| Client style | Tailwind v4 (`@tailwindcss/vite`)                   |
| Parsing      | [`@solidity-parser/parser`](https://github.com/solidity-parser/parser) |
| Graph        | React Flow 11                                       |
| Code editor  | Monaco (`@monaco-editor/react`)                     |
| Backend      | Express 4 + `node-cron` 3, run with `tsx` in dev, `tsc` + `node` in prod |

## Repository layout

npm-workspaces monorepo. The **client** lives at the repo root (Vite default `outDir` is `dist/`). The **server** is a workspace under `server/`.

```
sketchain/
├─ package.json                # workspace root, client deps + scripts
├─ tsconfig.json               # solution file (references both packages)
├─ tsconfig.base.json          # shared strict TS options
├─ tsconfig.app.json           # client app config (extends base)
├─ tsconfig.node.json          # client vite.config.ts (extends base)
├─ vite.config.ts              # + dev /api proxy to :3001
├─ eslint.config.js            # per-package rules
├─ index.html
├─ src/                        # client React app
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css
│  ├─ sample.ts
│  ├─ lib/                     # parseSolidity, astToGraph, selectors, codegen, templates
│  └─ components/              # CodePane, CanvasPane, ContractNode, EditableDetails,
│                              # FileUpload, FileTabs, Palette
├─ server/                     # @sketchain/server workspace
│  ├─ package.json
│  ├─ tsconfig.json            # extends base, Node target
│  └─ src/
│     ├─ index.ts              # express app, static dist, /api/*, cron bootstrap
│     ├─ routes/
│     │  ├─ health.ts          # GET  /api/health
│     │  └─ cron.ts            # POST /api/cron/external
│     └─ cron/
│        └─ jobs.ts            # node-cron scheduled tasks
└─ deploy.md                   # Render Web Service config
```

## Quick start

```bash
npm install                   # hoists client + server deps
npm run dev                   # runs client (5173) + server (3001) in parallel
npm run typecheck             # tsc -b builds both packages
npm run lint                  # eslint .
npm run build                 # vite build + server tsc
npm start                     # node server/dist/index.js  → serves dist + /api/*
```

Requires Node 20+ (Vite 8, `tsx`).

### How the dev ports work

- **Client** (Vite): `http://localhost:5173` &mdash; HMR, Fast Refresh.
- **Server** (Express + `tsx watch`): `http://localhost:3001` &mdash; auto-restarts on `.ts` changes.
- Vite proxies `/api/*` to `http://localhost:3001` so the browser can call `fetch("/api/health")` with no CORS.
- Override the server port with `SERVER_PORT=4000 npm run dev`.

### How production works

- `npm run build` runs `vite build` (client &rarr; `dist/`) and `tsc` (server &rarr; `server/dist/`).
- `npm start` runs `node server/dist/index.js`. The server binds to `0.0.0.0:$PORT` (Render injects `PORT`) and serves:
  - `dist/*` as static files
  - `/api/*` via the Express routes
  - any other path as the SPA fallback `dist/index.html`

## How the round-trip works

1. **Parse** &mdash; `@solidity-parser/parser` produces an AST with byte ranges. The parser also stores the **raw source slice** for every member (including leading comments + indentation).
2. **IR** &mdash; the AST is flattened into a `ContractInfo` with an ordered `members[]` (function / variable / event / modifier / struct / enum / error / other). Each member carries `raw` (verbatim text), `id` (stable), and `dirty` (initially `false`).
3. **Graph** &mdash; one node per contract, one edge per in-file inheritance.
4. **Edit** &mdash; the details panel mutates a draft, marking touched members `dirty: true`. Renaming a contract sets `headerDirty: true`.
5. **Apply** &mdash; `codegen` walks the IR: a clean member re-emits its `raw`; a dirty function/variable is regenerated from its structured fields. A clean contract emits its full `raw` (header included). The result is a fresh `.sol` source.
6. **Re-parse** &mdash; the new source is reparsed (300 ms debounce), giving a fresh IR with reset dirty flags. Anything you didn't touch comes back identical.

## Known limitations

- **Edited-member indentation** &mdash; clean members keep their original indent; edited ones are normalized to 4 spaces. A formatter pass would unify this.
- **Cross-file imports** are not resolved &mdash; each file is parsed independently.
- **No undo/redo** &mdash; a history stack of `files` snapshots is a small M3 add.
- **Modifiers/events** are not yet editable in the panel; they round-trip verbatim, the UI just doesn't expose mutation.
- **Monaco** has no built-in Solidity grammar; the editor falls back to plaintext highlighting. (Adding a Monarch grammar is straightforward.)
- **React Flow** runs in uncontrolled prop mode &mdash; drag positions reset when you re-parse. Moving to `useNodesState` for persistence is queued.
- **`/api/cron/external` is unauthenticated** &mdash; fine for dev; add a `CRON_SECRET` header check before pointing cron-job.org at a public URL.

## Roadmap (M3)

- Persist files to `localStorage` + undo/redo
- Cross-file import resolution
- Blockchain mode: wallet connect, fetch verified source by address, read on-chain state (via `/api/chain/*` endpoints)
- Solidity grammar for Monaco
- Formatter pass to normalize edited-member indentation
- Add `CRON_SECRET` check on `/api/cron/external`

## Deployment

See [deploy.md](./deploy.md) for the full Render Web Service guide, including the "No open ports detected on 0.0.0.0" fix that bit us on the first deploy.
