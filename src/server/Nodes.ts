import Node from "./Node"
import { NodeInformation } from "./interfaces/NodeInformation";
import { ValidatorData } from "./interfaces/ValidatorData"

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

  public getNodeById(id: string): Node {
    return this.getNode((n: Node) => n.getId() === id)
  }

  public createEmptyNode(id: string) {
    const node = new Node(id)
    this.push(node)
    return node;
  }

  public all(): Node[] {
    this.removeOldNodes()

    return this
      .filter((elem: Node, index, self) => self.findIndex(
        (t: Node) => {
          return (t.getId() === elem.getId())
        }) === index
      )
  }

  private removeOldNodes(): void {
    const deleteList = []

    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].isInactiveAndOld()) {
        deleteList.push(i)
      }
    }

    if (deleteList.length > 0) {
      console.log(`Deleting ${deleteList.length} stale nodes!`)

      for (let i = 0; i < deleteList.length; i++) {
        this.splice(deleteList[i], 1)
      }
    }
  }
}
