import { Wrapper } from "../interfaces/Wrapper";
import _ from "lodash";

export function isInputValid(
  stats: Wrapper
): boolean {
  return (
    !_.isUndefined(stats) && !_.isUndefined(stats.id)
  )
}
