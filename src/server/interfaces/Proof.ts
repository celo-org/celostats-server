export interface Proof {
  // ether base of the node
  address: string
  // hash of the msg
  msgHash: string
  // public key of the ether base of the node
  publicKey: string
  // signature of the msg hash created with ether base private key
  signature: string
}
