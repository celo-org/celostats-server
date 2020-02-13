import { Address } from "./Address"

export interface Pending {
  readonly id: Address
  readonly pending: number
}
