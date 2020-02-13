import { Info } from "./Info";
import { Uptime } from "./Uptime"
import { ValidatorData } from "./ValidatorData"
import { StatsSummary } from "./StatsSummary"
import { Address } from "./Address"

export interface NodeSummary {
  id: Address
  info: Info
  stats: StatsSummary
  uptime: Uptime
  validatorData: ValidatorData
}
