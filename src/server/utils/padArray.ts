export function padArray<T>(
  arr: T[],
  len: number,
  fill: T
): T[] {
  return arr.concat(Array(len).fill(fill)).slice(0, len)
}
