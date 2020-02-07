import { NodeData } from "./NodeData";
import { InfoWrapped } from "./InfoWrapped";

export interface NodeInformation {
  readonly nodeData: NodeData
  readonly stats: InfoWrapped
}
