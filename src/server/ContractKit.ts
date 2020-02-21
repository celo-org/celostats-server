import { cfg } from "./utils/config"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ContractKit, newKit } from "@celo/contractkit"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import Web3 from "web3";

let validators: ValidatorsWrapper = null;
let election: ElectionWrapper = null;
let web3: Web3 = null;

let contractsLoaded = false;

(async () => {
  if (!contractsLoaded) {
    try {
      const kit: ContractKit = await newKit(cfg.JSONRPC)

      // load contracts
      validators = await kit.contracts.getValidators()
      election = await kit.contracts.getElection();
      web3 = kit.web3;

      console.success('Contract kit loaded!')

      contractsLoaded = true
    } catch (err) {
      console.error('Loading of contract kit failed!', err.message)
    }
  }
})()

const getContracts = () => {
  if (contractsLoaded) {
    return {
      validators,
      election,
      web3
    }
  }

  return null
}

export {
  getContracts
}
