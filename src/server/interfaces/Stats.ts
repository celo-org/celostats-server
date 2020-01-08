import { BasicStats } from "./BasicStats";
import { Block } from "./Block";
import { Info } from "./Info";

export interface Stats extends BasicStats {
  id?: string
  propagationAvg?: number
  name?: string
  registered?: boolean
  signer?: string
  pending: number
  block: Block
  clientTime?: number
  info?: Info
}
