import { Block } from "./Block";

export interface BlockStats {
  id: string
  block: Block
  propagationAvg: number,
  history: number[]
}
