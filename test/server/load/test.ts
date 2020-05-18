import { dummyBlock } from "../constants"
import { Block } from "../../../src/server/interfaces/Block"
import { fuzzy, getRandomInt, sleep } from "./utils"
import { Node } from "./Node"
import { Transaction } from "../../../src/server/interfaces/Transaction"
import Server from "../../../src/server/server/server"
import { Validator } from "../../../src/server/interfaces/Validator";
import { Address } from "../../../src/server/interfaces/Address";

// shall the output be verbose?
const verbose = true

// everything is factor times faster
const factor = 10

// volatility of numbers in percent
const volatilityPercent = 10

// number of nodes to emulate
const nodeCount = 20
const validatorGroupCount = 3

const registeredValidatorsRatio = 90
const registeredValidatorsCount = Math.floor((nodeCount / 100) * registeredValidatorsRatio)

const electedValidatorsRatio = 60
const electedValidatorsCount = Math.floor((registeredValidatorsCount / 100) * electedValidatorsRatio)

const epochSize = 10
const valSetPropagationInterval = 4

const testDuration = 10 * 60

let blockRemain = epochSize
let blockNumber = getRandomInt(0, 10)

class NodeWithSigner extends Node {
  public singer: Node

  constructor(
    id: string,
    factor: number,
    volatilityPercent: number,
    verbose: boolean
  ) {
    super(id, factor, volatilityPercent, verbose);

    this.singer = new Node(
      id + 'signer',
      factor,
      volatilityPercent,
      verbose
    )
  }

}

const nodes: NodeWithSigner[] = []
const validatorGroups: Node[] = []
const registeredValidators: Validator[] = []
let electedValidatorAddresses: Address[] = []

// start server
const server = new Server()
server.init()

const bInterval = fuzzy(2, volatilityPercent)

console.log(`Blocktime is ${bInterval} seconds`)

const blockInterval = setInterval(() => {
  const block: Block = {
    ...dummyBlock,
    number: blockNumber,
    totalDifficulty: blockNumber.toString(),
    hash: "0x1" + getRandomInt(0, 1000000),
    miner: nodes[getRandomInt(0, nodeCount - 1)].getAddress(),
    validators: null,
    epochSize,
    blockRemain,
    transactions: Array(getRandomInt(0, 50)).map((t) => {
      return <Transaction>{
        hash: `0x${t}`
      }
    })
  }

  // epoch ended, re-elect
  if (blockRemain === epochSize) {
    electedValidatorAddresses = registeredValidators
      // randomize array
      .sort(() => Math.random() - 0.5)
      // reduce till we meet max elected validators count
      .slice(registeredValidators.length - electedValidatorsCount, registeredValidators.length)
      .map((validator): Address => {
        return validator.address
      })

    nodes.forEach((node) => {
      node.setElected(electedValidatorAddresses.indexOf(node.address) > -1)
    })
  }

  // shall we send out the val set?
  if (blockNumber % valSetPropagationInterval === 0) {
    block.validators = {
      registered: registeredValidators,
      elected: electedValidatorAddresses
    }
  }

  nodes.forEach((node) => {
    setTimeout(() => {
      node.onBlock(block)
    }, fuzzy(getRandomInt(0, 100), volatilityPercent))
  })

  blockNumber++;
  blockRemain--;

  // did we reach the end of the epoch already?
  if (blockRemain <= 0) {
    blockRemain = epochSize
  }
}, (bInterval / factor) * 1000)

// setup nodes
for (let x = 0; x < nodeCount; x++) {
  const node = new NodeWithSigner(
    `node-${x}`,
    factor,
    volatilityPercent,
    verbose
  )

  nodes.push(node)
  node.start()
}

// setup validator groups
for (let x = 0; x < validatorGroupCount; x++) {
  const node = new Node(
    `validatorGroup-${x}`,
    factor,
    volatilityPercent,
    verbose
  )

  validatorGroups.push(node)
}

// setup validators
registeredValidators.push(
  ...nodes
    // randomize array
    .sort(() => Math.random() - 0.5)
    // reduce till we meet max elected validators count
    .slice(nodes.length - registeredValidatorsCount, nodes.length)
    // map node to validators structure
    .map((node, i): Validator => {
      node.setRegistered(true)
      return {
        affiliation: validatorGroups[i % validatorGroupCount].address,
        // todo set this properly
        blsPublicKey: "abc",
        // todo set this properly
        ecdsaPublicKey: "cde",
        // todo set this properly
        score: "100000000000000000000",
        signer: node.address,
        address: node.address
      }
    })
)

;(async () => {
  //node.start();
  await new Promise((resolve) => setTimeout(resolve, testDuration * 1000))

  clearInterval(blockInterval)

  for (const node of nodes) {
    node.end()
  }

  server.stop()
})()



