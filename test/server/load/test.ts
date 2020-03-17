import { dummyBlock } from "../constants"
import { Block } from "../../../src/server/interfaces/Block"
import { fuzzy, getRandomInt } from "./utils"
import { Node } from "./Node"

const verbose = true
const factor = 1
const volatilityPercent = 5
const nodeCount = 10

let blockNumber = 0

const nodes: Node[] = []

const bInterval = fuzzy(2, volatilityPercent)

console.log(`$Blocktime is ${bInterval}`)

setInterval(() => {
  const block: Block = {
    ...dummyBlock,
    number: blockNumber,
    totalDifficulty: blockNumber.toString(),
    hash: "0x1" + getRandomInt(0, 100000),
    miner: nodes[getRandomInt(0, nodeCount - 1)].getAddress()
  }

  nodes.forEach((node: Node) => {
    node.onBlock(block)
  })

  blockNumber++;
}, (bInterval / factor) * 1000)

for (let x = 0; x < nodeCount; x++) {

  const node = new Node(
    `node-${x}`,
    factor,
    volatilityPercent,
    verbose
  )

  node.start()
  nodes.push(node)
  ;(async () => {
    //node.start();
    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000))
    node.end()
  })()
}
