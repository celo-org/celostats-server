import { Address } from "./Address"

export interface ValidatorData {
  readonly score: number
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
  readonly affiliation: Address
  validatorGroupName?: string
  readonly signer: Address
  readonly address: Address
}
