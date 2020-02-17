export enum Events {
  // client events
  // node latency
  Latency = "latency",
  // overall charts
  Charts = "charts",
  // the information about a node going inactive
  Inactive = "inactive",
  // the nodes stats
  Stats = "stats",
  // the pending transactions
  Pending = "pending",
  // the last block number
  LastBlock = "lastBlock",
  // the block summary
  Block = "block",
  // the lists of all nodes
  Init = "init",
  // a single node
  Add = "add",
  ClientLatency = "client-latency",

  // client upkeep
  Ready = "ready",
  ClientPing = "client-ping",
  ClientPong = "client-pong",

  // node upkeep
  Hello = "hello",
  NodePing = "node-ping",
  NodePong = "node-pong",

  // socket io stuff
  Connection = "connection",
  Disconnecting = "disconnecting",
  Error = "error",

  // Primus stuff
  Disconnection = "disconnection",
  End = "end"
}
