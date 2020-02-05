export interface Proof {
  // ether base of the node
  readonly address: string
  // hash of the msg
  readonly msgHash: string
  // public key of the ether base of the node
  readonly publicKey: string
  // signature of the msg hash created with ether base private key
  readonly signature: string
}
