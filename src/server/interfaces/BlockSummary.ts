import { BlockBase } from "./BlockBase"
import { ValidatorCounts } from "./ValidatorCounts"

export interface BlockSummary extends BlockBase {
  readonly validators: ValidatorCounts
  readonly transactions: number
}
