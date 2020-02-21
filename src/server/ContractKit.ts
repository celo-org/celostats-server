import { cfg } from "./utils/config"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import Web3 from "web3";

const web3: Web3 = new Web3(new Web3.providers.HttpProvider(cfg.JSONRPC, {
    keepAlive: true,
    timeout: cfg.timeout
  })
);

let validators: ValidatorsWrapper = null;
let election: ElectionWrapper = null;
let contractsLoaded = false;

(async () => {
  if (!contractsLoaded) {
    try {
      const kit: ContractKit = await newKitFromWeb3(web3)

      // load contracts
      validators = await kit.contracts.getValidators()
      election = await kit.contracts.getElection();

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
