import { Address } from "./Address"

export interface Wrapper {
  // this in on most of the cases the node name, not the id
  readonly id: Address
}
