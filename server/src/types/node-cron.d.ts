declare module "node-cron" {
  type CronExpression = string
  type ScheduledTask = { stop: () => void }
  const cron: {
    schedule(
      expression: CronExpression,
      callback: () => void,
    ): ScheduledTask
  }
  export default cron
}
