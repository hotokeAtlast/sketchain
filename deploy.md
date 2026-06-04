# Deploying Sketchain to Render

Sketchain is an npm-workspaces monorepo: the **React client** lives at the repo root (`src/`), and the **Express backend** lives at `server/`. The build outputs `dist/` (Vite) and `server/dist/` (tsc). The server serves the static `dist/` and handles `/api/*` in one process &mdash; **one Render Web Service, one URL, no CORS**.

This doc covers Render Web Service config. The most common deployment failure is Render showing

```
==> No open ports detected on 0.0.0.0, continuing to scan...
```

That error and its fix are documented in detail at the end. **Read it before debugging anything else.**

## 1. One-time setup

### 1.1 Push to GitHub

```bash
git add -A
git commit -m "monorepo: client + server"
git push
```

If this is the first push:

```bash
git remote add origin git@github.com:<you>/sketchain.git
git push -u origin main
```

### 1.2 Create the Render Web Service

1. Go to <https://dashboard.render.com/> and sign in.
2. Click **New +** &rarr; **Web Service** (not Static Site).
3. Connect your GitHub account if you haven't, then pick the `sketchain` repo.
4. Fill in:

   | Field                 | Value                                  |
   | --------------------- | -------------------------------------- |
   | **Name**              | `sketchain` (or anything)              |
   | **Region**            | your nearest                           |
   | **Branch**            | `main` (or your default)               |
   | **Runtime**           | `Node`                                 |
   | **Build Command**     | `npm install && npm run build`         |
   | **Start Command**     | `npm start`                            |
   | **Health Check Path** | `/api/health`                          |
   | **Instance Type**     | Free (Starter) is fine                 |

5. Click **Create Web Service**. The first build will take a couple of minutes.

### 1.3 (Optional) Add a custom domain

Service dashboard &rarr; **Settings** &rarr; **Custom Domain**. Render issues a free `*.onrender.com` URL automatically.

## 2. What `npm run build` does

```
npm install                  # hoists client + server deps to one node_modules
npm run build
  ├─ vite build              # client   →  dist/      (static React app)
  └─ npm -w server run build # server   →  server/dist/  (compiled Express)
npm start
  └─ node server/dist/index.js
       ├─ serves dist/*  statically
       ├─ /api/health, /api/cron/*  handled by Express
       └─ SPA fallback  (any non-/api path → dist/index.html)
       └─ listens on 0.0.0.0:$PORT  (Render injects PORT)
```

## 3. Environment variables

Set in the Render dashboard &rarr; **Environment** &rarr; **Add Environment Variable**.

| Var | Required | Purpose |
| --- | --- | --- |
| `PORT` | implicit | Render injects this automatically. The server reads it via `process.env.PORT`; do **not** hard-code a port. |
| `NODE_VERSION` | recommended | Pin to `20` if Render defaults to Node 18 (Vite 8 needs 20+). Or commit a `.nvmrc` with `20`. |
| `CRON_SECRET` | later | Header secret for `POST /api/cron/external` once you add auth. |

## 4. Infrastructure-as-Code option

Commit a `render.yaml` to the repo root, then use **New +** &rarr; **Blueprint** to create the service from it:

```yaml
services:
  - type: web
    name: sketchain
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 20
```

## 5. Verifying the deployment

After the build turns green and the service status is **Live**:

1. Open the Render-provided URL (`https://sketchain.onrender.com` or your custom domain).
2. You should see the sample contracts (`Token`, `Ownable`, `IToken`) on the canvas.
3. Click a node &rarr; edit something &rarr; **Apply to code** &rarr; the Monaco editor should show the regenerated source.
4. Visit `https://<your-service>.onrender.com/api/health` &rarr; should return JSON `{ "ok": true, ... }`.
5. `curl -X POST https://<your-service>.onrender.com/api/cron/external -H "content-type: application/json" -d '{"job":"default"}'` &rarr; returns `{ "ok": true, "job": "default", "result": {...} }`.

## 6. External cron (cron-job.org)

1. Go to <https://cron-job.org> &rarr; **Create cronjob**.
2. URL: `https://<your-service>.onrender.com/api/cron/external`
3. Method: `POST`
4. Body: `{"job":"default"}`
5. Schedule: every 15 minutes (or whatever the job needs).
6. Save.

`POST /api/cron/external` is **currently unauthenticated** (per the project's M3 scope). Add a `CRON_SECRET` check before exposing the URL in any public place.

## 7. Troubleshooting

### 7.1 `==> No open ports detected on 0.0.0.0, continuing to scan...`

This is the most common Render failure for Node apps. **What it means:** Render started the container, ran your start command, and waited up to ~15 minutes for a process to bind to `0.0.0.0:$PORT` &mdash; nothing did, so it killed the deploy.

The causes, in order of frequency:

| Cause | Fix |
| --- | --- |
| **No start command** (or the start command exits immediately) | Set **Start Command** to `npm start`. This repo's `package.json` defines `"start": "npm -w server run start"` which runs `node server/dist/index.js`. If `server/dist/index.js` doesn't exist, the build failed earlier &mdash; check the build logs. |
| **App binds to `127.0.0.1` / `localhost` instead of `0.0.0.0`** | `app.listen(port, "0.0.0.0", cb)`. Express's default is fine, but if you wrap it in anything that calls `.listen(port)` without a host, verify the host argument. This repo's `server/src/index.ts` explicitly binds to `0.0.0.0`. |
| **App reads `PORT` from somewhere else (`.env`, hard-coded value)** | Always use `process.env.PORT`. Render injects it. Don't commit a `.env` that overrides it. |
| **`server/dist/` doesn't exist** | The `npm run build` step failed to compile the server. Check the build log for `tsc` errors. |
| **App crashes before binding** | Read the deploy logs for the first stack trace. Often a `Cannot find module` because a workspace dep wasn't hoisted. |
| **Free instance sleeping** | Free Web Services **spin down after 15 min of inactivity** and the first hit after that takes ~30 s to wake. This does **not** trigger the "no open ports" error &mdash; if you see that error, the process never bound. |

The diagnostic checklist:

1. **Open the deploy logs** &mdash; dashboard &rarr; your service &rarr; **Logs**.
2. Look for the line `[server] listening on http://0.0.0.0:<port>`. If it's there, the server **did** bind and the "no open ports" message was a false alarm from Render's pre-bind scanner; the service is actually fine.
3. If you don't see that line, look for the first error above it. The most common ones:
   - `Error: Cannot find module 'express'` &rarr; workspace didn't install. Re-run `npm install` locally and commit `package-lock.json`.
   - `Error: listen EADDRINUSE` &rarr; a previous process is still bound. Restart the service.
   - `Error: Cannot find module './routes/health.js'` &rarr; you ran the compiled `dist/index.js` but the `.js` siblings weren't emitted. Check that `server/src/routes/*.ts` and `server/src/cron/*.ts` actually built. The fix in this repo is to import with the `.js` extension (NodeNext-style) so `tsc` resolves them; double-check the build output.
4. **Verify the health check path** in the dashboard matches a real route &mdash; set it to `/api/health`.
5. **Set `NODE_VERSION=20`** in env vars. Vite 8 and `tsx` need Node 20+; if Render falls back to 18 the server may not start at all.

### 7.2 `tsc` fails on Render but passes locally

Render defaults to Node 18. Set `NODE_VERSION=20` in env, or commit a `.nvmrc` with `20` at the repo root &mdash; Render respects it.

### 7.3 `Module not found` for a workspace package

The `server` workspace must be installed at the root (`npm install` hoists it). If Render only ran `npm install` inside `server/`, deps are missing. The build command in this doc installs at the root, which is correct.

### 7.4 Build runs out of memory

Free instances have ~512 MB. `vite build` and `tsc` are both memory-hungry. If you see `Killed` during the build, upgrade to a paid instance or split the build into two steps.

### 7.5 `Cross-Origin Request Blocked` from the browser

Means the browser is hitting the API from a different origin. This shouldn't happen with this setup (the server serves both the static app and the API on the same origin). If it does, double-check that the deployed app is loading JS from the **same hostname** as the one you `curl /api/health` against. If you're using a custom domain and a Render preview domain at the same time, that mismatch can trigger CORS.

### 7.6 Old build is being served

Render caches the build artifact per deploy. Trigger a manual deploy from the dashboard's **Manual Deploy** &rarr; **Clear build cache & deploy** if a deploy succeeded but is serving stale code.
