export interface PropagationTime {
  fork: number
  propagation: number
  readonly node: string
  readonly trusted: boolean
  readonly received: number
}
