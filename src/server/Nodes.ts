import Node from "./Node"
import { NodeSummary } from "./interfaces/NodeSummary"
import { Address } from "./interfaces/Address"
import History from "./History"

export default class Nodes extends Array<Node> {

  private getIndex(
    search: { (n: Node): boolean }
  ): number {
    return this.indexOf(this.find(search))
  }

  private getNode(
    search: { (n: Node): boolean }
  ): Node {
    const index = this.getIndex(search)
    return index > -1 ? this[index] : null
  }

  public getNodeBySpark(spark: string): Node {
    return this.getNode((n: Node) => n.getSpark() === spark)
  }

  public getNodeById(id: Address): Node {
    return this.getNode((n: Node) => n.getId() === id)
  }

  public createEmptyNode(
    id: Address,
    history: History,
  ): Node {
    const node = new Node(id, history)
    this.push(node)
    return node;
  }

  public all(): NodeSummary[] {
    this.removeOldNodes()

    return this
      .filter((node: Node, index: number, self: Node[]) => self.findIndex(
        (t: Node) => {
          return (t.getId() === node.getId())
        }) === index
      )
      .map((n) => n.getSummary())
  }

  private removeOldNodes(): void {
    const deleteList = []

    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].isInactiveAndOld()) {
        deleteList.push(i)
      }
    }

    if (deleteList.length > 0) {
      console.success(`Deleting ${deleteList.length} stale nodes!`)

      for (let i = 0; i < deleteList.length; i++) {
        this.splice(deleteList[i], 1)
      }
    }
  }
}
