import express from "express"
import cors from "cors"
import path from "node:path"
import { fileURLToPath } from "node:url"

import healthRouter from "./routes/health.js"
import cronRouter from "./routes/cron.js"
import { startScheduledJobs } from "./cron/jobs.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

app.use("/api/health", healthRouter)
app.use("/api/cron", cronRouter)

const clientDist = path.resolve(__dirname, "..", "..", "dist")
app.use(express.static(clientDist))
app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"))
})

const port = Number(process.env.PORT) || 3001
const host = "0.0.0.0"
app.listen(port, host, () => {
  console.log(`[server] listening on http://${host}:${port}`)
  console.log(`[server] serving client from ${clientDist}`)
  startScheduledJobs()
})
