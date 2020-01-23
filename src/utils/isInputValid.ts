import { Wrapper } from "../interfaces/Wrapper";

export function isInputValid(
  stats: Wrapper
): boolean {
  return (stats && !!stats.id)
}
