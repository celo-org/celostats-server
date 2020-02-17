import { Validator } from "./Validator";
import { Address } from "./Address"

export interface Validators {
  readonly registered: Validator[]
  readonly elected: Address[]
}
