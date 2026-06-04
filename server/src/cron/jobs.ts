import cron from "node-cron"

type JobResult = { ran: boolean; message: string }

const jobs = new Map<string, () => JobResult>([
  [
    "default",
    () => {
      const stamp = new Date().toISOString()
      console.log(`[cron:default] tick ${stamp}`)
      return { ran: true, message: `default tick at ${stamp}` }
    },
  ],
])

export function startScheduledJobs(): void {
  cron.schedule("*/15 * * * *", () => runJob("default"))
  console.log("[cron] scheduled: default every 15 minutes")
}

export function runJob(name: string): JobResult {
  const job = jobs.get(name)
  if (!job) return { ran: false, message: `unknown job: ${name}` }
  return job()
}
