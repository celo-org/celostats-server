import { ValidatorData } from "./ValidatorData"

export interface ValidatorDataWithStaking extends ValidatorData {
  elected: boolean
  registered: boolean
}
