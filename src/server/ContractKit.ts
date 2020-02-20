import { cfg } from "./utils/config"
import { ValidatorsWrapper } from "@celo/contractkit/lib/wrappers/Validators"
import { ContractKit, newKit } from "@celo/contractkit"

let validatorsContract: ValidatorsWrapper = null;

(async () => {
  if (!validatorsContract) {
    try {
      const kit: ContractKit = newKit(cfg.JSONRPC)

      // load validators contract
      validatorsContract = await kit.contracts.getValidators()

      console.success('Contract kit loaded!')
    } catch (err) {
      console.error('Loading of contract kit failed!', err.message)
    }
  }
})()

export {
  validatorsContract
}
