import { Info } from "./Info";
import { Wrapper } from "./Wrapper";

export interface InfoWrapped extends Wrapper {
  readonly address: string
  readonly info: Info
}
