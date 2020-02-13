import { Info } from "./Info";
import { Wrapper } from "./Wrapper";
import { Address } from "./Address"

export interface InfoWrapped extends Wrapper {
  readonly address: Address
  readonly info: Info
}
