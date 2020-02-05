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

    if (index >= 0) {
      return this[index]
    }

    return null
  }

  public getNodeBySigner(signer: string): Node {
    return this.getNode((n: Node) => n.getValidatorData().signer === signer)
  }

  public getNodeBySpark(spark: string): Node {
    return this.getNode((n: Node) => n.getSpark() === spark)
  }

  public getNodeByAddress(address: string) {
    return this.getNode((n: Node) => n.getId() === address)
  }

  public createByValidatorData(validator: ValidatorData) {
    const node = new Node()
    node.setValidatorData(validator)
    this.push(node)
    return node;
  }

  public createByNodeInformation(nodeInformation: NodeInformation): Node {
    const node = new Node()
    node.initWithNodeInformation(nodeInformation)
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
      for (let i = 0; i < deleteList.length; i++) {
        this.splice(deleteList[i], 1)
      }
    }
  }
}
