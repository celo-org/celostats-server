export interface ValidatorData {
  readonly elected: boolean
  readonly registered: boolean
  readonly score: string,
  readonly blsPublicKey: string
  readonly ecdsaPublicKey: string
  readonly affiliation: string
  readonly signer: string
}
