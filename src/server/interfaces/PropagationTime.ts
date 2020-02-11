import { Address } from "./Address"

export interface PropagationTime {
  readonly node: Address
  readonly trusted: boolean
  fork: number
  readonly received: number
  propagation: number
}
