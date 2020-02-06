import { Info } from "./Info";
import { Uptime } from "./Uptime"
import { ValidatorData } from "./ValidatorData"
import { StatsSummary } from "./StatsSummary"

export interface NodeSummary {
  id: string,
  info: Info
  stats: StatsSummary
  uptime: Uptime
  validatorData: ValidatorData
}
