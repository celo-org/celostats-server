export function padArray(
  arr: any[],
  len: number,
  fill: any
): number[] {
  return arr.concat(Array(len).fill(fill)).slice(0, len)
}
