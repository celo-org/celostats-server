import { Address } from "./Address"

export interface ValidatorData {
  readonly score: string,
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
  readonly affiliation: Address
  readonly signer: Address
}
