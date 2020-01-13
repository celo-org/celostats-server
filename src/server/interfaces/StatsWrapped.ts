import { Stats } from "./Stats";
import { Wrapper } from "./Wrapper";

export interface StatsWrapped extends Wrapper {
  stats?: Stats
}
