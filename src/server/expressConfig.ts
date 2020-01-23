import express from "express"
import compression from "compression"
import { cfg } from "../utils/config";

export const expressConfig = express()

if (cfg.compression) {
  expressConfig.use(compression())
}
