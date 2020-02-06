export interface PropagationTime {
  readonly node: string,
  readonly trusted: boolean,
  fork: number,
  readonly received: number,
  propagation: number
}
