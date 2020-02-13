import { Address } from "./Address"

export interface Validator {
  // node address
  readonly address: Address
  // signer address
  readonly signer: Address
  // validator group
  readonly affiliation: Address
  // score
  readonly score: string
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
}
