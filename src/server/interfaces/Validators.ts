import { Validator } from "./Validator";

export interface Validators {
  readonly registered: Validator[]
  readonly elected: string[]
}
