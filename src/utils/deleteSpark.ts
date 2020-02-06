// @ts-ignore
import Primus from "primus"

export function deleteSpark(
  spark: Primus.spark
): void {
  setTimeout((): void => {

    Object.keys(spark)
      .forEach((key) => {
        delete spark[key]
      })

    Object.getOwnPropertyNames(spark)
      .forEach((key) => {
        delete spark[key]
      })

    for (const key in spark) {
      delete (spark[key])
    }

  }, 10);
}
