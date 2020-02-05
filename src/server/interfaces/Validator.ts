export interface Validator {
  // node address
  readonly address: string
  // signer address
  readonly signer: string
  // validator group
  readonly affiliation: string
  // score
  readonly score: string
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
}
