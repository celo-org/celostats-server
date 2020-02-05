import { BlockBase } from "./BlockBase"
import { ValidatorCounts } from "./ValidatorCounts"

export interface BlockSummary extends BlockBase {
  validators: ValidatorCounts
  transactions: number
}
