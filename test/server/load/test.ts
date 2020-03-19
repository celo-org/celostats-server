import { dummyBlock } from "../constants"
import { Block } from "../../../src/server/interfaces/Block"
import { fuzzy, getRandomInt, sleep } from "./utils"
import { Node } from "./Node"
import { Transaction } from "../../../src/server/interfaces/Transaction"
import Server from "../../../src/server/server/server"

// shall the output be verbose?
const verbose = true

// everything is factor times faster
const factor = 1

// volatility of numbers in percent
const volatilityPercent = 10

// number of nodes to emulate
const nodeCount = 10
const epochSize = 100
const duration = 10 * 60

let blockRemain = epochSize
let blockNumber = getRandomInt(0, 10)

const nodes: Node[] = []

// start server
const server = new Server()
server.init()

const bInterval = fuzzy(2, volatilityPercent)

console.log(`Blocktime is ${bInterval} seconds`)

const blockInterval = setInterval(() => {
  const block: Block = {
    ...dummyBlock,
    number: blockNumber,
    difficulty: (1).toString(),
    totalDifficulty: blockNumber.toString(),
    hash: "0x1" + getRandomInt(0, 1000000),
    miner: nodes[getRandomInt(0, nodeCount - 1)].getAddress(),
    epochSize,
    blockRemain,
    transactions: Array(getRandomInt(0, 50)).map((t) => {
      return <Transaction>{
        hash: `0x${t}`
      }
    })
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

for (let x = 0; x < nodeCount; x++) {
  const node = new Node(
    `node-${x}`,
    factor,
    volatilityPercent,
    verbose
  )

  nodes.push(node)
  node.start()
}

;(async () => {
  //node.start();
  await new Promise((resolve) => setTimeout(resolve, duration * 1000))

  clearInterval(blockInterval)

  for (const node of nodes) {
    node.end()
  }

  server.stop()
})()



