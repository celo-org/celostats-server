import express from "express";
import { cfg } from "../utils/config"
import { getContracts } from "../ContractKit"

export const routes = express.Router()

/**
 * Base view
 */
routes.get('/', (
  req: express.Request,
  res: express.Response
) => {
  res.render('index')
})

/**
 * Memory view
 */
routes.get('/memory', (
  req: express.Request,
  res: express.Response
) => {
  const mem = process.memoryUsage()

  res.set('Content-Type', 'text/html');
  res.send(Buffer.from(`
<div>
    <div>rss: ${(mem.rss / 1024 / 1024).toFixed(2)}mb</div>
    <div>heapUsed: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}mb</div>
    <div>heapTotal: ${(mem.heapTotal / 1024 / 1024).toFixed(2)}mb</div>
    <div>external: ${(mem.external / 1024 / 1024).toFixed(2)}mb</div>
</div>
`
  ))
})

/**
 * Config view
 */
routes.get('/config', (
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
 * Contract view
 */
routes.get('/contracts', (
  req: express.Request,
  res: express.Response
) => {
  const contracts = getContracts()

  res.set('Content-Type', 'text/html');

  if (contracts) {

    (async () => {
      const css = await contracts.validators.currentSignerSet()
      const election = await contracts.election.getConfig()
      res.send(Buffer.from(
        `
<pre>
Node: ${cfg.JSONRPC}

Current Signer Set: ${JSON.stringify(css, null, 2)}

Election Config: ${JSON.stringify(election, null, 2)}

Highest Block: ${await contracts.web3.eth.getBlockNumber()}
</pre>`
      ))
    }
  )()

    } else {
      res.send(
        Buffer.from('Contracts lot loaded :(')
      )
    }
  })

  /**
   * catch 404 and forward to error handler
   */
  routes.use((
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const err = new Error(

    `Not Found ${req.url}`

    )
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
