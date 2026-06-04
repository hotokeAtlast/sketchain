import { Router } from "express"
import { runJob } from "../cron/jobs.js"

// TODO: add CRON_SECRET header check before prod. The endpoint is open for
// now so cron-job.org (and any other external scheduler) can ping it freely.
const router = Router()

router.post("/external", (req, res) => {
  const job =
    typeof req.body?.job === "string" && req.body.job.length > 0
      ? req.body.job
      : "default"
  const result = runJob(job)
  res.json({ ok: true, job, result })
})

export default router
