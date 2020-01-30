export interface Validator {
  signer: string
  registered: boolean
  elected: boolean
  address: string
  trusted: boolean
  readonly name: string
  readonly url: string
  readonly affiliation: string
}
