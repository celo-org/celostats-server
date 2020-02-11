import { Address } from "./Address"

export interface ValidatorData {
  readonly score: number
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
  readonly affiliation: Address
  readonly signer: Address
  readonly address: Address
}
