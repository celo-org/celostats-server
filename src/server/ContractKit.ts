import './utils/logger'
import { cfg } from "./utils/config"
import { ContractKit, newKit } from "@celo/contractkit"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import Web3 from "web3";
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
      const contractkit: ContractKit = newKit(cfg.JSONRPC)
      
      // load contracts
      const validators: ValidatorsWrapper = await contractkit.contracts.getValidators()
      const election: ElectionWrapper = await contractkit.contracts.getElection()
      const chainId = await contractkit.connection.chainId()
      
      kit = {
        validators,
        election,
        connection: kit.connection,
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
