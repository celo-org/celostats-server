import './utils/logger'
import { cfg } from "./utils/config"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
import { ElectionWrapper } from "@celo/contractkit/lib/wrappers/Election"
import Web3 from "web3";

let web3: Web3 = null;
let validators: ValidatorsWrapper = null;
let election: ElectionWrapper = null;
let contractsLoaded = false;

async function loadContractKit() {
  if (!contractsLoaded) {
    try {
      web3 = new Web3(new Web3.providers.HttpProvider(cfg.JSONRPC, {
          keepAlive: true,
          timeout: cfg.timeout
        })
      );

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
}

function reset() {
  contractsLoaded = false
  loadContractKit()
    .then(() => console.success("ContractKit connection reset!"))
}

const getContractKit = () => {
  if (contractsLoaded) {
    return {
      validators,
      election,
      web3
    }
  }

  return null
}

(async () => {
  await loadContractKit()
})()

if (cfg.cycleContractKit) {
  setInterval(() => reset(), 20 * 1000)
}

export {
  getContractKit,
  reset
}
