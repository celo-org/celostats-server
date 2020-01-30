export enum Events {
  Latency = "latency",
  Charts = "charts",
  Inactive = "inactive",
  Stats = "stats",
  Pending = "pending",
  LastBlock = "lastBlock",
  Block = "block",
  Ready = "ready",
  Init = "init",
  // node has been added
  Add = "add",

  // client stuff
  ClientPing = "client-ping",
  ClientPong = "client-pong",
  ClientLatency = "client-latency",

  // socket io stuff
  Connection = "connection",
  Disconnecting = "disconnecting",
  Error = "error",

  // Primus stuff
  Disconnection = "disconnection",
  End = "end",

  // node stuff
  Hello = "hello",
  NodePing = "node-ping",
  NodePong = "node-pong",
}
