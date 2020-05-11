import { Validators } from "./Validators";
import { Transaction } from "./Transaction";
import { BlockBase } from "./BlockBase"

export interface Block extends BlockBase {
  validators: Validators
  readonly transactions: Transaction[]
}
