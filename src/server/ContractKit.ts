import './utils/logger'
import { cfg } from "./utils/config"
import { ContractKit, newKit } from "@celo/contractkit"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import { Connection } from '@celo/connect'

let kit: { 
  validators: ValidatorsWrapper 
  election: ElectionWrapper 
  connection: Connection
  chainId: number
} = null

const getContractKit = async () => {
  if (!kit) {
    try {
      const contractKit: ContractKit = newKit(cfg.JSONRPC)
      
      // load contracts
      const validators: ValidatorsWrapper = await contractKit.contracts.getValidators()
      const election: ElectionWrapper = await contractKit.contracts.getElection()
      const chainId = await contractKit.connection.chainId()
      
      kit = {
        validators,
        election,
        connection: contractKit.connection,
        chainId
      }
    } catch (err) {
      console.error('Loading of contract kit failed!', (err as Error).message)
    }
  }

  return kit
}

export {
  getContractKit
}
