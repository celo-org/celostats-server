import express from "express";
import { expressConfig } from "./expressConfig"
import { cfg } from "../utils/config"

export const routes = express.Router()

/**
 * Memory view
 */
routes.get('/memory', (
  req: express.Request,
  res: express.Response
) => {
  const mem = process.memoryUsage()

  res.set('Content-Type', 'text/html');
  res.send(
    Buffer.from(`
<div>
    <div>rss: ${(mem.rss / 1024 / 1024).toFixed(2)}mb</div>
    <div>heapUsed: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}mb</div>
    <div>heapTotal: ${(mem.heapTotal / 1024 / 1024).toFixed(2)}mb</div>
    <div>external: ${(mem.external / 1024 / 1024).toFixed(2)}mb</div>
</div>
`
    )
  )
})

expressConfig.get('/config', (
  req: express.Request,
  res: express.Response
) => {
  res.set('Content-Type', 'text/html');
  res.send(
    Buffer.from(
      `<pre>${JSON.stringify(cfg, null, 2)}</pre>`
    )
  )
})

/**
 * catch 404 and forward to error handler
 */
routes.use((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const err = new Error(`Not Found ${req.url}`)
  res.status(404)
  next(err)
})

/**
 * Error handler
 */
routes.use((
  err: any,
  req: express.Request,
  res: express.Response
) => {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: err
  })
})
