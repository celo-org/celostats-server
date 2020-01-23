import Node from "./Node"
import { NodeInformation } from "./interfaces/NodeInformation";
import { Validator } from "./interfaces/Validator";

export default class Nodes extends Array<Node> {

  public getIndex(
    search: { (n: Node): boolean }
  ): number {
    return this.indexOf(this.find(search))
  }

  public getNode(
    search: { (n: Node): boolean }
  ): Node {
    const index = this.getIndex(search)

    if (index >= 0) {
      return this[index]
    }

    return null
  }

  public getByIndex(
    index: number
  ): Node {
    if (this[index]) {
      return this[index]
    }

    return
  }

  private getIndexOrNew(
    search: { (n: Node): boolean },
    data: NodeInformation | Validator
  ): number {
    const index = this.getIndex(search)

    return (index >= 0 ? index : this.push(new Node(data)) - 1)
  }

  public getNodeOrNew(
    search: { (n: Node): boolean },
    data: NodeInformation | Validator
  ): Node {
    return this.getByIndex(
      this.getIndexOrNew(search, data)
    )
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
      for (let i = 0; i < deleteList.length; i++) {
        this.splice(deleteList[i], 1)
      }
    }
  }

}
