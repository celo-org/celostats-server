import { Validator } from "./Validator";
import { Address } from "./Address"

export interface Validators {
  registered: Validator[]
  elected: Address[]
}
