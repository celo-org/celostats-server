import './utils/logger'
import { cfg } from "./utils/config"
import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import Web3 from "web3";

const getContractKit = async () => {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(cfg.JSONRPC, {
        keepAlive: true,
        timeout: cfg.timeout
      })
    );

    const kit: ContractKit = await newKitFromWeb3(web3)

    // load contracts
    const validators: ValidatorsWrapper = await kit.contracts.getValidators()
    const election: ElectionWrapper = await kit.contracts.getElection();

    return {
      validators,
      election,
      web3
    }
  } catch (err) {
    console.error('Loading of contract kit failed!', err.message)
  }

  return null
}

export {
  getContractKit
}
