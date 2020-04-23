import { Info } from "./Info";
import { Uptime } from "./Uptime"
import { StatsSummary } from "./StatsSummary"
import { Address } from "./Address"
import { ValidatorDataWithStaking } from "./ValidatorDataWithStaking"
import { SignedState } from "./SignedState"

export interface NodeSummary {
  id: Address
  info: Info
  stats: StatsSummary
  uptime: Uptime
  validatorData: ValidatorDataWithStaking
  signHistory: SignedState[]
}
