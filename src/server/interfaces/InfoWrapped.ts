import { Info } from "./Info";
import { Wrapper } from "./Wrapper";

export interface InfoWrapped extends Wrapper {
  readonly info: Info
}
