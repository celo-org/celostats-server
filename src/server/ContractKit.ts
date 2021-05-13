import './utils/logger'
import { cfg } from "./utils/config"
import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
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
      const web3 = new Web3(
        new Web3.providers.HttpProvider(cfg.JSONRPC, {
          keepAlive: true,
          timeout: cfg.timeout
        })
      );
      
      const contractKit: ContractKit = newKitFromWeb3(web3)
      
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
      console.error('Loading of contract kit failed!', err.message)
    }
  }

  return kit
}

export {
  getContractKit
}
