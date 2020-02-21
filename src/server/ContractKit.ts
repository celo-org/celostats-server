import { cfg } from "./utils/config"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ContractKit, newKit } from "@celo/contractkit"

let validatorsContract: ValidatorsWrapper = null;
let contractsLoaded = false;

(async () => {
  if (!validatorsContract) {
    try {
      const kit: ContractKit = await newKit(cfg.JSONRPC)

      // load validators contract
      validatorsContract = await kit.contracts.getValidators()

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
      validatorsContract
    }
  }

  return null
}

export {
  getContracts
}
